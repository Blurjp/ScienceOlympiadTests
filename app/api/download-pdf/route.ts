import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { saveTest, getCachedPdfParse, savePdfParseCache, logApiUsage } from '@/lib/database';
import { getOpenAI, computeCostUsd } from '@/lib/openai';
import { mapDifficultyForDatabase } from '@/lib/difficulty';
import { safeFetch, UnsafeUrlError } from '@/lib/url-guard';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { extractGoogleDriveFileId, toGoogleDriveDirectDownload } from '@/lib/google-drive';
import { generateId } from '@/lib/utils';
import { Test, Question, Region } from '@/lib/types';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for downloads

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const maxDuration = 300; // 5 minutes for PDF processing (Vercel Pro max)

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Require authentication (bypass in development)
  const isDev = process.env.NODE_ENV === 'development';
  if (!session && !isDev) {
    return NextResponse.json(
      { error: 'Please sign in to import tests from URLs' },
      { status: 401 }
    );
  }

  // Cost-abuse protection: 10 imports per IP per 5 minutes
  const rateLimit = checkRateLimit('download-pdf', getClientIp(request), 10, 5 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL
    let pdfUrl: URL;
    try {
      pdfUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Convert Google Drive sharing URLs to direct download URLs
    let downloadUrl = pdfUrl.toString();
    const googleDriveFileId = extractGoogleDriveFileId(downloadUrl);
    if (googleDriveFileId) {
      downloadUrl = toGoogleDriveDirectDownload(googleDriveFileId);
      console.log(`Converted Google Drive URL to direct download: ${downloadUrl}`);
    }

    // Check cache first
    const cached = await getCachedPdfParse(url);
    if (cached && cached.questions.length > 0) {
      // Create test from cached questions
      const questions: Question[] = cached.questions.map((q: any) => ({
        ...q,
        id: generateId(), // New IDs for each test
      }));

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const metadata = cached.metadata || {};

      const test: Test = {
        id: generateId(),
        year: metadata.year || new Date().getFullYear(),
        title: metadata.title || `Test from ${pdfUrl.hostname}`,
        description: `Imported from ${url}`,
        difficulty: mapDifficultyForDatabase(metadata.difficulty || 'Regional') as any,
        totalTime: metadata.totalTime || 3600,
        totalPoints,
        topic: metadata.topic || 'General',
        region: metadata.region as Region | undefined,
        questions,
      };

      await saveTest(test, url, undefined, userId);

      return NextResponse.json({
        success: true,
        test,
        fromCache: true,
        questionsFound: questions.length,
        sourceUrl: url,
        message: 'Test imported from cached parse results',
      });
    }

    // Download PDF with SSRF protection and a hard body-size cap
    let pdfBytes: Uint8Array;
    try {
      const { response, body } = await safeFetch(downloadUrl, MAX_FILE_SIZE, {
        headers: { 'User-Agent': BROWSER_UA },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        return NextResponse.json(
          { error: 'URL does not point to a PDF file' },
          { status: 400 }
        );
      }

      pdfBytes = body;
    } catch (error) {
      if (error instanceof UnsafeUrlError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: 'Failed to download PDF',
          details: error instanceof Error ? error.message : 'Network error',
        },
        { status: 500 }
      );
    }

    // Check if we got HTML instead of PDF (common with login pages, error pages, or Google Drive virus scan warning)
    const headerBytes = new TextDecoder().decode(pdfBytes.slice(0, 100));
    if (headerBytes.toLowerCase().includes('<html') || headerBytes.toLowerCase().includes('<!doctype')) {
      // Check if this is a Google Drive virus scan warning page
      const htmlContent = new TextDecoder().decode(pdfBytes);

      if (googleDriveFileId && (htmlContent.includes('virus scan') || htmlContent.includes('confirm='))) {
        // Try to extract the confirm token and retry with it
        const confirmMatch = htmlContent.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const retryUrl = `${toGoogleDriveDirectDownload(googleDriveFileId)}&confirm=${confirmToken}`;

          try {
            const { response: retryResponse, body: retryBytes } = await safeFetch(retryUrl, MAX_FILE_SIZE, {
              headers: { 'User-Agent': BROWSER_UA },
            });

            if (retryResponse.ok) {
              const retryHeader = new TextDecoder().decode(retryBytes.slice(0, 100));

              if (retryHeader.startsWith('%PDF')) {
                // Successfully got the PDF on retry - use this data
                pdfBytes = retryBytes;
              } else {
                // Still not a PDF after retry
                return NextResponse.json(
                  {
                    error: 'Google Drive requires additional confirmation for this file.',
                    details: 'Try downloading the file manually and using the Upload PDF feature instead.'
                  },
                  { status: 400 }
                );
              }
            }
          } catch (retryError) {
            if (retryError instanceof UnsafeUrlError) {
              return NextResponse.json(
                { error: retryError.message },
                { status: 400 }
              );
            }
            console.error('Google Drive retry failed:', retryError);
            return NextResponse.json(
              {
                error: 'Failed to download from Google Drive after virus scan bypass attempt.',
                details: 'Try downloading the file manually and using the Upload PDF feature instead.'
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: 'Google Drive requires additional confirmation for this file. This may be because the file is large or flagged for virus scanning.',
              details: 'Try downloading the file manually and using the Upload PDF feature instead.'
            },
            { status: 400 }
          );
        }
      } else if (googleDriveFileId && (htmlContent.includes('Request access') || htmlContent.includes('You need permission'))) {
        // Check if this is a Google Drive access denied page
        return NextResponse.json(
          {
            error: 'Access denied. The Google Drive file is not publicly shared.',
            details: 'Please make sure the file sharing is set to "Anyone with the link can view".'
          },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          {
            error: 'The URL returned a webpage instead of a PDF file. This usually means the link requires login or the file is not directly accessible.',
            details: 'The server returned HTML content instead of a PDF. Try using a direct download link.'
          },
          { status: 400 }
        );
      }
    }

    // Re-check the header with potentially updated bytes
    const finalHeaderBytes = new TextDecoder().decode(pdfBytes.slice(0, 100));

    if (!finalHeaderBytes.startsWith('%PDF')) {
      return NextResponse.json(
        {
          error: 'The downloaded file is not a valid PDF',
          details: `File starts with: ${finalHeaderBytes.substring(0, 20)}...`
        },
        { status: 400 }
      );
    }

    let text: string;
    let numPages: number;
    try {
      const result = await extractText(pdfBytes, { mergePages: true });
      text = result.text as string;
      numPages = result.totalPages;
    } catch (pdfError: any) {
      console.error('PDF parsing error:', pdfError?.message || pdfError);

      // Provide more specific error messages
      const errorMsg = pdfError?.message?.toLowerCase() || '';
      let userMessage = 'Failed to parse PDF.';

      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        userMessage = 'This PDF is password-protected. Please use an unprotected PDF.';
      } else if (errorMsg.includes('corrupt') || errorMsg.includes('invalid')) {
        userMessage = 'This PDF appears to be corrupted or in an unsupported format.';
      } else {
        userMessage = 'Failed to parse PDF. The file may be corrupted, password-protected, or in an unsupported format.';
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: pdfError?.message || 'Unknown parsing error'
        },
        { status: 500 }
      );
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'PDF appears to be empty or contains only images (no extractable text)' },
        { status: 400 }
      );
    }

    // Use LLM to parse questions from PDF text
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = getOpenAI();

    // Truncate text if too long (keep first ~100000 chars - GPT-4o-mini has 128k context)
    const truncatedText = text.length > 100000 ? text.substring(0, 100000) + '\n...[truncated]' : text;

    const systemPrompt = `You are a meticulous Science Olympiad test parser. You MUST extract EVERY SINGLE question from the provided PDF text. Do not skip any questions. Do not summarize.

CRITICAL: Extract ALL questions, even if there are many (30-50+ is common). Count them as you go.

For each question found:
1. The COMPLETE question text (do not truncate)
2. Type: "multiple-choice" if it has A/B/C/D options, otherwise "short-answer"
3. Options array for multiple choice, null for short-answer
4. Correct answer if visible, empty string if not
5. Point value if shown, default to 1
6. Category/topic

Also extract metadata:
- Title (if found)
- Topic/Event name
- Year (if found)
- Competition level (Invitational, Regional, State, National)

Return JSON:
{
  "metadata": {
    "title": "string or null",
    "topic": "string - the Science Olympiad event name",
    "year": "number or null",
    "difficulty": "Invitational|Regional|State|National"
  },
  "questions": [
    {
      "type": "multiple-choice or short-answer",
      "question": "the COMPLETE question text",
      "options": ["A) option", "B) option", "C) option", "D) option"] or null,
      "correctAnswer": "the answer if found, empty string if not",
      "points": 1,
      "category": "topic category"
    }
  ],
  "totalFound": <number of questions extracted>
}

IMPORTANT: You MUST include every numbered item (1, 2, 3...), lettered item (a, b, c...), or any question format found.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this Science Olympiad test PDF:\n\n${truncatedText}` }
      ],
      temperature: 0.3,
      max_tokens: 16000, // Increased to handle more questions
      response_format: { type: 'json_object' },
    });

    // Track usage
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const costUsd = computeCostUsd(usage);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      await logApiUsage({
        userId,
        endpoint: 'download-pdf',
        model: 'gpt-4o-mini',
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        success: false,
        errorMessage: 'Empty response from LLM',
      });

      return NextResponse.json(
        { error: 'Failed to parse questions from PDF' },
        { status: 500 }
      );
    }

    // Parse LLM response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      );
    }

    const questionsData = parsed.questions || [];
    const metadata = parsed.metadata || {};

    if (questionsData.length === 0) {
      return NextResponse.json(
        { error: 'No questions could be extracted from the PDF' },
        { status: 400 }
      );
    }

    // Create question objects
    const questions: Question[] = questionsData.map((q: any) => ({
      id: generateId(),
      type: q.type || 'short-answer',
      question: q.question,
      options: q.options || undefined,
      correctAnswer: q.correctAnswer || '',
      points: q.points || 1,
      category: q.category || metadata.topic || 'General',
    }));

    // Save to cache for future use
    await savePdfParseCache(url, questionsData, metadata, numPages);

    // Create test object
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: generateId(),
      year: metadata.year || new Date().getFullYear(),
      title: metadata.title || `Test from ${pdfUrl.hostname}`,
      description: `Imported from ${url}`,
      difficulty: mapDifficultyForDatabase(metadata.difficulty || 'Regional') as any,
      totalTime: 3600,
      totalPoints,
      topic: metadata.topic || 'General',
      questions,
    };

    // Save to database
    await saveTest(test, url, undefined, userId);

    // Log successful usage
    await logApiUsage({
      userId,
      endpoint: 'download-pdf',
      model: 'gpt-4o-mini',
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      topic: metadata.topic,
      difficulty: metadata.difficulty,
      questionCount: questions.length,
      success: true,
    });

    return NextResponse.json({
      success: true,
      test,
      fromCache: false,
      pages: numPages,
      questionsFound: questions.length,
      sourceUrl: url,
      message: `Successfully parsed ${questions.length} questions from PDF`,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

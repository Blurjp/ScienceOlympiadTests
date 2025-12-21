import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import OpenAI from 'openai';
import { saveTest, getCachedPdfParse, savePdfParseCache, logApiUsage } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question, Region } from '@/lib/types';
import { auth } from '@/auth';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for downloads

// Map competition level values to database-compatible difficulty values
// The database CHECK constraint only allows: 'Easy', 'Medium', 'Hard'
function mapDifficultyForDatabase(difficulty: string): string {
  const competitionLevelMap: Record<string, string> = {
    'Invitational': 'Easy',
    'Regional': 'Medium',
    'State': 'Medium',
    'National': 'Hard',
  };
  return competitionLevelMap[difficulty] || difficulty;
}

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveFileId(url: string): string | null {
  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Pattern 2: https://drive.google.com/file/d/FILE_ID/view
  // Pattern 3: https://drive.google.com/open?id=FILE_ID
  // Pattern 4: https://drive.google.com/uc?id=FILE_ID&export=download

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// GPT-4o-mini pricing
const PRICE_PER_1K_PROMPT_TOKENS = 0.00015;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.0006;

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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
      downloadUrl = `https://drive.google.com/uc?export=download&id=${googleDriveFileId}`;
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

      await saveTest(test, url);

      return NextResponse.json({
        success: true,
        test,
        fromCache: true,
        questionsFound: questions.length,
        sourceUrl: url,
        message: 'Test imported from cached parse results',
      });
    }

    // Download PDF
    let response: Response;
    try {
      response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to download PDF',
          details: error instanceof Error ? error.message : 'Network error',
        },
        { status: 500 }
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      return NextResponse.json(
        { error: 'URL does not point to a PDF file' },
        { status: 400 }
      );
    }

    // Get file size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'PDF file is too large (max 50MB)' },
        { status: 400 }
      );
    }

    // Download and extract text from PDF
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Check if it looks like a PDF (should start with %PDF)
    const headerBytes = new TextDecoder().decode(uint8Array.slice(0, 100));

    // Check if we got HTML instead of PDF (common with login pages, error pages, or Google Drive virus scan warning)
    let pdfBytes = uint8Array;
    if (headerBytes.toLowerCase().includes('<html') || headerBytes.toLowerCase().includes('<!doctype')) {
      // Check if this is a Google Drive virus scan warning page
      const htmlContent = new TextDecoder().decode(uint8Array);

      if (googleDriveFileId && (htmlContent.includes('virus scan') || htmlContent.includes('confirm='))) {
        // Try to extract the confirm token and retry with it
        const confirmMatch = htmlContent.match(/confirm=([a-zA-Z0-9_-]+)/);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const retryUrl = `https://drive.google.com/uc?export=download&id=${googleDriveFileId}&confirm=${confirmToken}`;

          try {
            const retryResponse = await fetch(retryUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              redirect: 'follow',
            });

            if (retryResponse.ok) {
              const retryBuffer = await retryResponse.arrayBuffer();
              const retryUint8Array = new Uint8Array(retryBuffer);
              const retryHeader = new TextDecoder().decode(retryUint8Array.slice(0, 100));

              if (retryHeader.startsWith('%PDF')) {
                // Successfully got the PDF on retry - use this data
                pdfBytes = retryUint8Array;
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
    const costUsd = (promptTokens / 1000 * PRICE_PER_1K_PROMPT_TOKENS) +
                    (completionTokens / 1000 * PRICE_PER_1K_COMPLETION_TOKENS);

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
    await saveTest(test, url);

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

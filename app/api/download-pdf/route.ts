import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import OpenAI from 'openai';
import { saveTest, getCachedPdfParse, savePdfParseCache, logApiUsage } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question, Region } from '@/lib/types';
import { auth } from '@/auth';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for downloads

// GPT-4o-mini pricing
const PRICE_PER_1K_PROMPT_TOKENS = 0.00015;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.0006;

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const maxDuration = 120; // 2 minutes for PDF processing

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Require authentication
  if (!session) {
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
        difficulty: metadata.difficulty || 'Regional',
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
      response = await fetch(pdfUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SciOlyTestApp/1.0)',
        },
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

    let text: string;
    let numPages: number;
    try {
      const result = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = result.text as string;
      numPages = result.totalPages;
    } catch (pdfError: any) {
      console.error('PDF parsing error:', pdfError?.message || pdfError);
      return NextResponse.json(
        {
          error: 'Failed to parse PDF. The file may be corrupted or password-protected.',
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

    // Truncate text if too long (keep first ~15000 chars to stay within token limits)
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '\n...[truncated]' : text;

    const systemPrompt = `You are a Science Olympiad test parser. Extract questions from the provided PDF text.

For each question found, determine:
1. The question text
2. Whether it's multiple-choice or short-answer
3. The answer options (if multiple choice)
4. The correct answer (if visible in the text, otherwise leave empty)
5. Point value (if mentioned, otherwise default to 1)
6. Category/topic area

Also extract metadata about the test:
- Title (if found)
- Topic/Event name
- Year (if found)
- Competition level (Invitational, Regional, State, National)

Return JSON in this exact format:
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
      "question": "the question text",
      "options": ["A) option", "B) option", "C) option", "D) option"] or null,
      "correctAnswer": "the answer if found, empty string if not",
      "points": 1,
      "category": "topic category"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this Science Olympiad test PDF:\n\n${truncatedText}` }
      ],
      temperature: 0.3,
      max_tokens: 4000,
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
      difficulty: metadata.difficulty || 'Regional',
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

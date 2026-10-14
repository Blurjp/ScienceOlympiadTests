import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { logApiUsage } from '@/lib/database';
import { PARSING_MODEL, createChatCompletion, computeCostUsd } from '@/lib/openai';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { normalizeParsedQuestions } from '@/lib/question-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PAGES = 30; // Increased to handle longer tests

// Extend serverless function timeout
export const maxDuration = 300; // 5 minutes (Vercel Pro max)

export async function POST(request: NextRequest) {
  try {
    // Cost-abuse protection: 10 uploads per IP per 5 minutes
    const rateLimit = checkRateLimit('parse-pdf-vision', getClientIp(request), 10, 5 * 60 * 1000);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

    // Attribute usage to the signed-in user when available (best-effort)
    const session = await auth();
    const userId = session?.user?.id;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type && file.type !== 'application/pdf' && file.type !== 'application/octet-stream') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Check if it's actually a PDF (should start with %PDF)
    const headerBytes = new TextDecoder().decode(uint8Array.slice(0, 100));

    if (headerBytes.toLowerCase().includes('<html') || headerBytes.toLowerCase().includes('<!doctype')) {
      return NextResponse.json(
        { error: 'The uploaded file appears to be an HTML file, not a PDF.' },
        { status: 400 }
      );
    }

    if (!headerBytes.startsWith('%PDF')) {
      return NextResponse.json(
        { error: 'The uploaded file is not a valid PDF.' },
        { status: 400 }
      );
    }

    // Check if we have OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured.' },
        { status: 500 }
      );
    }

    // Dynamic import for pdf-to-img (ESM module)
    const { pdf } = await import('pdf-to-img');

    // Convert PDF pages to images
    const images: string[] = [];
    let totalPages = 0;

    try {
      const document = await pdf(Buffer.from(uint8Array), { scale: 1.5 });
      totalPages = document.length;

      if (totalPages > MAX_PAGES) {
        return NextResponse.json(
          {
            error: `This PDF has ${totalPages} pages; Vision AI supports at most ${MAX_PAGES} pages per import.`,
            details: 'No pages were dropped or parsed. Split the PDF into smaller sections and try again.',
            pages: totalPages,
            maxPages: MAX_PAGES,
            truncated: true,
            code: 'PDF_PAGE_LIMIT_EXCEEDED',
          },
          { status: 422 }
        );
      }

      for await (const image of document) {
        // Convert buffer to base64
        const base64 = Buffer.from(image).toString('base64');
        images.push(base64);
      }
    } catch (pdfError: any) {
      console.error('PDF to image conversion error:', pdfError?.message || pdfError);
      return NextResponse.json(
        {
          error: 'Failed to convert PDF to images.',
          details: pdfError?.message || 'PDF conversion failed'
        },
        { status: 500 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any pages from the PDF.' },
        { status: 400 }
      );
    }

    // Build the content array with images
    const imageContents: OpenAI.ChatCompletionContentPart[] = images.map((base64, index) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/png;base64,${base64}`,
        detail: 'high' as const,
      },
    }));

    const systemPrompt = `You are a meticulous document parser that extracts EVERY question from Science Olympiad test PDFs. You NEVER skip questions.

CRITICAL: Analyze ALL ${images.length} page images and extract EVERY SINGLE question you can find. Do not skip any. Do not summarize. Tests typically have 30-50+ questions.

For each question found:
- question: The COMPLETE question text (do not truncate)
- type: "multiple-choice" if it has A/B/C/D options, "short-answer" otherwise
- options: Array like ["A) ...", "B) ...", "C) ...", "D) ..."] for multiple choice, null for others
- correctAnswer: The answer if visible, empty string if not
- points: Point value if shown (default 1)
- category: Topic/category if identifiable

Output ONLY valid JSON:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Full question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "points": 1,
      "category": "Topic Name"
    },
    {
      "type": "short-answer",
      "question": "Full question text here",
      "correctAnswer": "",
      "points": 2,
      "category": "Topic Name"
    }
  ],
  "metadata": {
    "testTitle": "Test title if visible",
    "totalPages": ${images.length},
    "totalQuestionsFound": <number>
  }
}

IMPORTANT: Count every numbered item (1, 2, 3...), lettered item (a, b, c...), or question format. Include ALL of them.`;

    // 5 minute timeout for vision parsing
    const completion = await createChatCompletion({
      model: PARSING_MODEL,
      timeout: 300000,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all questions from these ${images.length} PDF page(s). Return valid JSON only.`,
            },
            ...imageContents,
          ],
        },
      ],
      // Room for reasoning tokens (counted against the completion budget
      // on gpt-5-family models) plus the long JSON extraction
      maxCompletionTokens: 16000,
      reasoningEffort: 'low',
      responseFormatJson: true,
    });

    const content = completion.choices[0]?.message?.content;

    // Usage/cost of the parse call (available for all outcomes below)
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const costUsd = computeCostUsd(usage, { model: PARSING_MODEL });

    // Non-fatal usage logging helper (never blocks the response)
    const logUsage = async (opts: {
      success: boolean;
      errorMessage?: string;
      questionCount?: number;
      topic?: string;
    }) => {
      try {
        await logApiUsage({
          userId,
          endpoint: 'parse-pdf-vision',
          model: PARSING_MODEL,
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
          topic: opts.topic,
          questionCount: opts.questionCount,
          success: opts.success,
          errorMessage: opts.errorMessage,
        });
      } catch (logError) {
        console.error('Failed to log API usage:', logError);
      }
    };

    if (completion.choices[0]?.finish_reason === 'length') {
      await logUsage({ success: false, errorMessage: 'AI output truncated (finish_reason=length)' });
      return NextResponse.json(
        {
          error: 'The extracted test was too long for the AI response limit.',
          details: 'No partial result was returned. Split the PDF into smaller sections and try again.',
          code: 'AI_OUTPUT_TRUNCATED',
        },
        { status: 422 }
      );
    }

    if (!content) {
      await logUsage({ success: false, errorMessage: 'Empty response from AI' });
      return NextResponse.json(
        { error: 'Failed to parse questions - empty response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let questions;
    let metadata: any = {};

    try {
      const parsed = JSON.parse(content);
      metadata = parsed.metadata || {};

      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        await logUsage({ success: false, errorMessage: 'No questions found in AI response', questionCount: 0, topic: metadata?.topic });
        return NextResponse.json(
          {
            error: 'No questions could be extracted from the PDF.',
            details: 'The AI could not identify any questions in the document.',
          },
          { status: 400 }
        );
      }

      // Add IDs to questions
      questions = normalizeParsedQuestions(questionArray);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError, 'Content:', content?.substring(0, 500));
      await logUsage({ success: false, errorMessage: `JSON parse failed: ${parseError?.message || 'unknown'}`, topic: metadata?.topic });
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
          details: parseError?.message || 'JSON parse failed',
        },
        { status: 500 }
      );
    }

    await logUsage({
      success: true,
      questionCount: questions.length,
      topic: metadata?.topic,
    });

    return NextResponse.json({
      success: true,
      questions,
      pages: images.length,
      totalPages,
      truncated: false,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        parsedAt: new Date().toISOString(),
        parsedWithAI: true,
        visionParsing: true,
        ...metadata,
      }
    });
  } catch (error: any) {
    console.error('Server error:', error);

    // The LLM call either failed or threw before usage was available
    try {
      await logApiUsage({
        endpoint: 'parse-pdf-vision',
        model: PARSING_MODEL,
        success: false,
        errorMessage: `${error?.code || error?.name || 'error'}: ${error?.message || 'unknown'}`.substring(0, 500),
      });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the PDF.',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

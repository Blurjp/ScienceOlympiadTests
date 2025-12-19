import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import OpenAI from 'openai';
import { Question } from '@/lib/types';
import { generateId } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_EXTRACT_TIMEOUT = 120000; // 2 minutes timeout for PDF extraction

// Extend serverless function timeout
export const maxDuration = 300; // 5 minutes (Vercel Pro max)

function log(step: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[PDF-PARSE ${timestamp}] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

// Wrapper to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 300000, // 5 minute timeout
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  log('START', { timestamp: startTime });

  try {
    log('Step 1: Reading form data');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      log('ERROR: No file provided');
      return NextResponse.json(
        { error: 'No file provided', step: 'file-check' },
        { status: 400 }
      );
    }

    log('Step 2: File received', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: (file.size / 1024).toFixed(2) + ' KB'
    });

    // Validate file type
    if (file.type !== 'application/pdf') {
      log('ERROR: Invalid file type', { type: file.type });
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF file.', step: 'type-check', receivedType: file.type },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      log('ERROR: File too large', { size: file.size, max: MAX_FILE_SIZE });
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.', step: 'size-check', size: file.size },
        { status: 400 }
      );
    }

    // Convert file to buffer
    log('Step 3: Converting file to buffer');
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    log('Step 3 complete', { bufferSize: uint8Array.length });

    // Check if it's actually a PDF (should start with %PDF)
    const headerBytes = new TextDecoder().decode(uint8Array.slice(0, 100));
    log('Step 4: Checking PDF header', { header: headerBytes.substring(0, 20) });

    // Check if we got HTML instead of PDF
    if (headerBytes.toLowerCase().includes('<html') || headerBytes.toLowerCase().includes('<!doctype')) {
      log('ERROR: File is HTML, not PDF');
      return NextResponse.json(
        {
          error: 'The uploaded file appears to be an HTML file, not a PDF.',
          details: 'Please upload a valid PDF file.',
          step: 'header-check'
        },
        { status: 400 }
      );
    }

    if (!headerBytes.startsWith('%PDF')) {
      log('ERROR: Invalid PDF header', { header: headerBytes.substring(0, 20) });
      return NextResponse.json(
        {
          error: 'The uploaded file is not a valid PDF.',
          details: `File header: ${headerBytes.substring(0, 20)}...`,
          step: 'header-check'
        },
        { status: 400 }
      );
    }

    // Parse PDF using unpdf with timeout
    log('Step 5: Extracting text with unpdf');
    let text: string;
    let numPages: number;
    try {
      const result = await withTimeout(
        extractText(uint8Array, { mergePages: true }),
        PDF_EXTRACT_TIMEOUT,
        `PDF text extraction timed out after ${PDF_EXTRACT_TIMEOUT / 1000} seconds`
      );
      text = result.text as string;
      numPages = result.totalPages;
      log('Step 5 complete', {
        textLength: text?.length || 0,
        numPages,
        textPreview: text?.substring(0, 200) || 'empty'
      });
    } catch (pdfError: any) {
      log('ERROR: PDF extraction failed', {
        message: pdfError?.message,
        stack: pdfError?.stack?.substring(0, 500)
      });

      const errorMsg = pdfError?.message?.toLowerCase() || '';
      let userMessage = 'Failed to parse PDF.';
      let suggestVision = false;

      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        userMessage = 'PDF text extraction timed out. This PDF may be too complex for text extraction.';
        suggestVision = true;
      } else if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        userMessage = 'This PDF is password-protected. Please use an unprotected PDF.';
      } else if (errorMsg.includes('corrupt') || errorMsg.includes('invalid')) {
        userMessage = 'This PDF appears to be corrupted or in an unsupported format.';
      } else {
        userMessage = 'Failed to parse PDF. The file may be corrupted or in an unsupported format.';
        suggestVision = true;
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: pdfError?.message || 'Unknown parsing error',
          step: 'pdf-extraction',
          suggestVision
        },
        { status: suggestVision ? 422 : 500 }
      );
    }

    // Check if we got any text - detect scanned PDFs
    const textLength = text?.trim().length || 0;
    const charsPerPage = numPages > 0 ? textLength / numPages : 0;
    log('Step 6: Analyzing extracted text', { textLength, charsPerPage, numPages });

    // Heuristic: digital PDFs typically have 500+ chars per page
    // Scanned PDFs have very little or garbled text
    const isLikelyScanned = textLength < 50 || charsPerPage < 100;

    if (isLikelyScanned) {
      log('WARN: PDF appears to be scanned', { textLength, charsPerPage });
      return NextResponse.json(
        {
          error: 'This PDF appears to be scanned or image-based.',
          details: 'Very little text could be extracted. Try using Vision AI mode for better results.',
          suggestVision: true,
          extractedChars: textLength,
          pages: numPages,
          step: 'scanned-detection'
        },
        { status: 422 } // Unprocessable - suggest different method
      );
    }

    // Check if we have OpenAI API key for LLM parsing
    log('Step 7: Checking OpenAI API key');
    if (!process.env.OPENAI_API_KEY) {
      log('ERROR: OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.', step: 'api-key-check' },
        { status: 500 }
      );
    }
    log('Step 7 complete: API key present');

    // Use LLM to extract questions
    log('Step 8: Calling OpenAI API');
    const openai = getOpenAI();

    // Allow up to 50000 characters (GPT-4o-mini has 128k context)
    const truncatedText = text.length > 50000 ? text.substring(0, 50000) + '\n[truncated]' : text;
    log('Step 8a: Text prepared', { originalLength: text.length, truncatedLength: truncatedText.length });

    const prompt = `Extract questions from this test as JSON: {"questions":[{"type":"multiple-choice","question":"...","options":["A","B","C","D"],"correctAnswer":"A","points":1,"category":"General"}]}

${truncatedText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a document parser that extracts questions from Science Olympiad tests. Output valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    log('Step 8 complete: OpenAI response received', {
      finishReason: completion.choices[0]?.finish_reason,
      contentLength: completion.choices[0]?.message?.content?.length || 0
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      log('ERROR: Empty AI response');
      return NextResponse.json(
        { error: 'Failed to parse questions - empty response from AI', step: 'ai-response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    log('Step 9: Parsing AI response');
    let questions: Question[];
    try {
      const parsed = JSON.parse(content);

      // Handle both array and object with questions key
      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      log('Step 9a: Questions array extracted', { questionCount: questionArray.length });

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        log('WARN: No questions found in AI response');
        return NextResponse.json(
          {
            error: 'No questions could be extracted from the PDF.',
            details: 'The AI could not identify any questions in the document.',
            rawText: text,
            step: 'question-extraction'
          },
          { status: 400 }
        );
      }

      // Add IDs to questions
      questions = questionArray.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1,
        category: q.category || 'General',
      }));
      log('Step 9 complete', { questionsProcessed: questions.length });
    } catch (parseError: any) {
      log('ERROR: JSON parse failed', {
        error: parseError?.message,
        contentPreview: content?.substring(0, 500)
      });
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
          details: parseError?.message || 'JSON parse failed',
          rawText: text,
          step: 'json-parse'
        },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    log('SUCCESS', {
      questionsExtracted: questions.length,
      totalTimeMs: totalTime,
      pages: numPages
    });

    return NextResponse.json({
      success: true,
      questions,
      rawText: text,
      pages: numPages,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        parsedAt: new Date().toISOString(),
        parsedWithAI: true,
        processingTimeMs: totalTime,
      }
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    log('FATAL ERROR', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      stack: error?.stack?.substring(0, 1000),
      totalTimeMs: totalTime
    });

    // Handle OpenAI specific errors
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key configuration.', step: 'openai-auth' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.', step: 'openai-rate-limit' },
        { status: 429 }
      );
    }

    if (error?.code === 'insufficient_quota' || error?.status === 402) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.', step: 'openai-quota' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the PDF.',
        details: error?.message || (error instanceof Error ? error.message : 'Unknown error'),
        step: 'unknown',
        errorType: error?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}

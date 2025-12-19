import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Question } from '@/lib/types';
import { generateId } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PAGES = 10; // Limit pages to control costs

// Extend serverless function timeout
export const maxDuration = 300; // 5 minutes (Vercel Pro max)

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 300000, // 5 minute timeout for vision
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
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
    let pageCount = 0;

    try {
      const document = await pdf(Buffer.from(uint8Array), { scale: 1.5 });

      for await (const image of document) {
        if (pageCount >= MAX_PAGES) break;
        // Convert buffer to base64
        const base64 = Buffer.from(image).toString('base64');
        images.push(base64);
        pageCount++;
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

    // Use GPT-4o vision to extract questions from images
    const openai = getOpenAI();

    // Build the content array with images
    const imageContents: OpenAI.ChatCompletionContentPart[] = images.map((base64, index) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/png;base64,${base64}`,
        detail: 'high' as const,
      },
    }));

    const systemPrompt = `You are a document parser that extracts questions from Science Olympiad test PDFs.

Analyze the PDF page images and extract ALL questions you can find.

For each question, determine:
- The question text (full question)
- The question type: "multiple-choice", "short-answer", "true-false", or "calculation"
- For multiple choice: the options (A, B, C, D, etc.)
- The correct answer if visible (from an answer key) or leave empty if not shown
- Point value if shown (default to 1)
- Category/topic if identifiable

Output ONLY valid JSON in this exact format:
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
    "extractedQuestions": "count"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to parse questions - empty response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let questions: Question[];
    let metadata: any = {};

    try {
      const parsed = JSON.parse(content);
      metadata = parsed.metadata || {};

      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        return NextResponse.json(
          {
            error: 'No questions could be extracted from the PDF.',
            details: 'The AI could not identify any questions in the document.',
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
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError, 'Content:', content?.substring(0, 500));
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
          details: parseError?.message || 'JSON parse failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
      pages: images.length,
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

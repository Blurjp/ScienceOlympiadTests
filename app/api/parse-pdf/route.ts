import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import OpenAI from 'openai';
import { Question } from '@/lib/types';
import { generateId } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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

    // Check if we got HTML instead of PDF
    if (headerBytes.toLowerCase().includes('<html') || headerBytes.toLowerCase().includes('<!doctype')) {
      return NextResponse.json(
        {
          error: 'The uploaded file appears to be an HTML file, not a PDF.',
          details: 'Please upload a valid PDF file.'
        },
        { status: 400 }
      );
    }

    if (!headerBytes.startsWith('%PDF')) {
      return NextResponse.json(
        {
          error: 'The uploaded file is not a valid PDF.',
          details: `File header: ${headerBytes.substring(0, 20)}...`
        },
        { status: 400 }
      );
    }

    // Parse PDF using unpdf
    let text: string;
    let numPages: number;
    try {
      const result = await extractText(uint8Array, { mergePages: true });
      text = result.text as string;
      numPages = result.totalPages;
    } catch (pdfError: any) {
      console.error('PDF parsing error:', pdfError?.message || pdfError);

      const errorMsg = pdfError?.message?.toLowerCase() || '';
      let userMessage = 'Failed to parse PDF.';

      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        userMessage = 'This PDF is password-protected. Please use an unprotected PDF.';
      } else if (errorMsg.includes('corrupt') || errorMsg.includes('invalid')) {
        userMessage = 'This PDF appears to be corrupted or in an unsupported format.';
      } else {
        userMessage = 'Failed to parse PDF. The file may be corrupted, password-protected, or contain only scanned images.';
      }

      return NextResponse.json(
        {
          error: userMessage,
          details: pdfError?.message || 'Unknown parsing error'
        },
        { status: 500 }
      );
    }

    // Check if we got any text
    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error: 'Could not extract text from PDF. The file may contain only scanned images without OCR.',
          details: 'Try a PDF with selectable text, not a scanned document.'
        },
        { status: 400 }
      );
    }

    // Check if we have OpenAI API key for LLM parsing
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Use LLM to extract questions
    const openai = getOpenAI();

    // Truncate text if too long (keep first ~15000 chars to stay within token limits)
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...[truncated]' : text;

    const prompt = `Extract all questions from this Science Olympiad test document. For each question, identify:
1. The question text
2. Whether it's multiple choice or short answer
3. For multiple choice: the options (A, B, C, D)
4. The correct answer if visible, otherwise leave empty
5. Point value if mentioned, otherwise default to 1

Document text:
${truncatedText}

Return valid JSON with this exact structure:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "The question text here?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text or empty string if unknown",
      "points": 1,
      "category": "General"
    },
    {
      "type": "short-answer",
      "question": "The question text here?",
      "correctAnswer": "answer or empty string if unknown",
      "points": 2,
      "category": "General"
    }
  ]
}

Extract ALL questions you can find.`;

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
      temperature: 0.3,
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
    try {
      const parsed = JSON.parse(content);

      // Handle both array and object with questions key
      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        return NextResponse.json(
          {
            error: 'No questions could be extracted from the PDF.',
            details: 'The AI could not identify any questions in the document.',
            rawText: text,
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
          rawText: text,
        },
        { status: 500 }
      );
    }

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
      }
    });
  } catch (error: any) {
    console.error('Server error:', error);

    // Handle OpenAI specific errors
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    if (error?.code === 'insufficient_quota' || error?.status === 402) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the PDF.',
        details: error?.message || (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

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

    // Parse PDF using unpdf
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

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
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

Extract ALL questions you can find. Return ONLY the JSON array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a document parser that extracts questions from Science Olympiad tests. Output only valid JSON arrays. Never include markdown code blocks or explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
      max_tokens: 4000,
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
      // Clean up potential markdown code blocks
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();

      const parsed = JSON.parse(jsonContent);

      // Add IDs to questions
      questions = parsed.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1,
        category: q.category || 'General',
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
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
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the PDF.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

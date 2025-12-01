import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { parseQuestionsFromText, cleanPdfText } from '@/lib/question-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Clean and parse text
    const cleanedText = cleanPdfText(text);
    const questions = parseQuestionsFromText(cleanedText);

    return NextResponse.json({
      success: true,
      questions,
      rawText: cleanedText,
      pages: numPages,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        parsedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the PDF.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

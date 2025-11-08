import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
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

    // Parse PDF
    let data;
    try {
      data = await pdf(Buffer.from(buffer));
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
        { status: 500 }
      );
    }

    // Clean and parse text
    const cleanedText = cleanPdfText(data.text);
    const questions = parseQuestionsFromText(cleanedText);

    return NextResponse.json({
      success: true,
      questions,
      rawText: cleanedText,
      pages: data.numpages,
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

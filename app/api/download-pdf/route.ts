import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseQuestionsFromText, cleanPdfText } from '@/lib/question-parser';
import { saveTest } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test } from '@/lib/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for downloads

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, metadata } = body;

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
    if (contentType && !contentType.includes('pdf')) {
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

    // Download and parse PDF
    const buffer = await response.arrayBuffer();

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

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions could be extracted from the PDF' },
        { status: 400 }
      );
    }

    // Create test object
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    const test: Test = {
      id: generateId(),
      year: metadata?.year || new Date().getFullYear(),
      title: metadata?.title || `Test from ${pdfUrl.hostname}`,
      description: metadata?.description || `Downloaded from ${url}`,
      difficulty: metadata?.difficulty || 'Medium',
      totalTime: metadata?.totalTime || 3600,
      totalPoints,
      topic: metadata?.topic || 'General',
      questions,
    };

    // Save to database
    try {
      await saveTest(test, url);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save test to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test,
      rawText: cleanedText,
      pages: data.numpages,
      questionsFound: questions.length,
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

import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseQuestionsFromText, cleanPdfText } from '@/lib/question-parser';
import { saveTest } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test } from '@/lib/types';
import { validateSafeUrl, rateLimit, getClientIp, sanitizeError, validateCsrf } from '@/lib/security';
import { requireAuth } from '@/lib/auth-helpers';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for downloads

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const authError = await requireAuth();
    if (authError) return authError;

    // CSRF protection
    const csrfValidation = validateCsrf(request);
    if (!csrfValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // Rate limiting: 5 PDF downloads per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`pdf-download:${clientIp}`, 5, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { url, metadata } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL for SSRF protection
    const urlValidation = await validateSafeUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error || 'Invalid URL' },
        { status: 400 }
      );
    }

    // Download PDF
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SciOlyTestApp/1.0)',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = sanitizeError(error, 'Failed to download PDF');
      return NextResponse.json(
        { error: errorMessage },
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
      sanitizeError(pdfError, 'PDF parsing error');
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
      saveTest(test, url);
    } catch (dbError) {
      sanitizeError(dbError, 'Database error');
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
    const errorMessage = sanitizeError(error, 'Server error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

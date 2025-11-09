import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseQuestionsFromText, cleanPdfText } from '@/lib/question-parser';
import { rateLimit, getClientIp, sanitizeError, validateCsrf } from '@/lib/security';
import { requireAuth } from '@/lib/auth-helpers';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Rate limiting: 10 PDF uploads per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`pdf-parse:${clientIp}`, 10, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

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
      sanitizeError(pdfError, 'PDF parsing error');
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
    const errorMessage = sanitizeError(error, 'Server error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

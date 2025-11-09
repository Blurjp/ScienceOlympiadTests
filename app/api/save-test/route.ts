import { NextRequest, NextResponse } from 'next/server';
import { saveTest } from '@/lib/database';
import { Test } from '@/lib/types';
import { rateLimit, getClientIp, sanitizeError, validateCsrf } from '@/lib/security';
import { requireAuth } from '@/lib/auth-helpers';

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

    // Rate limiting: 20 saves per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`test-save:${clientIp}`, 20, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { test } = body;

    if (!test) {
      return NextResponse.json(
        { error: 'No test data provided' },
        { status: 400 }
      );
    }

    // Validate test data
    if (!test.id || !test.title || !test.questions || !Array.isArray(test.questions)) {
      return NextResponse.json(
        { error: 'Invalid test data structure' },
        { status: 400 }
      );
    }

    // Save test to database
    try {
      saveTest(test as Test);
    } catch (dbError) {
      sanitizeError(dbError, 'Database error');
      return NextResponse.json(
        { error: 'Failed to save test to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      testId: test.id,
    });
  } catch (error) {
    const errorMessage = sanitizeError(error, 'Server error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

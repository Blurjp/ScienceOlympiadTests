import { NextRequest, NextResponse } from 'next/server';
import { getTest, deleteTest } from '@/lib/database';
import { rateLimit, getClientIp, sanitizeError, validateCsrf } from '@/lib/security';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`test-get:${clientIp}`, 30, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const test = getTest(params.id);

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ test });
  } catch (error) {
    const errorMessage = sanitizeError(error, 'Database error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Rate limiting: 10 deletes per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`test-delete:${clientIp}`, 10, 60000);

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

    deleteTest(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = sanitizeError(error, 'Database error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

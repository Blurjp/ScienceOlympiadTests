import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSubscriptionStatus, getTest } from '@/lib/database';
import { isAdminEmail } from '@/lib/admin-auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { generateTestPdf, buildPdfFilename } from '@/lib/test-pdf';
import type { Test } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/export-test-pdf — Pro-only export of a test to a printable PDF.
 *
 * Body: { testId } | { test: Test }, plus optional includeAnswerKey (default true)
 *
 * `testId` loads a stored test (access-checked like GET /api/tests/[id]:
 * public tests for everyone, private tests for their owner or an admin).
 * `test` accepts an inline object the client already has (e.g. a just-
 * generated test); it is validated and length-capped rather than re-fetched.
 * Pro status is always verified server-side via getSubscriptionStatus.
 */

// Cost-abuse protection: PDF rendering is cheap but not free.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

/** Sanity caps for client-supplied content (sanitizeForPdf clamps each field). */
const MAX_QUESTIONS = 200;

interface ExportRequest {
  test?: unknown;
  testId?: unknown;
  includeAnswerKey?: unknown;
}

/** Validate the client-supplied test shape; returns null when unusable. */
function extractValidTest(payload: ExportRequest | null | undefined): Test | null {
  const candidate = payload?.test;
  if (!candidate || typeof candidate !== 'object') return null;

  const test = candidate as Partial<Test>;
  if (typeof test.title !== 'string' || test.title.trim().length === 0) return null;
  if (!Array.isArray(test.questions) || test.questions.length === 0) return null;
  if (test.questions.length > MAX_QUESTIONS) return null;

  for (const question of test.questions) {
    if (!question || typeof question !== 'object') return null;
    if (typeof question.question !== 'string' || question.question.trim().length === 0) {
      return null;
    }
    if (typeof question.correctAnswer !== 'string') return null;
    if (
      question.options !== undefined &&
      (!Array.isArray(question.options) ||
        question.options.some((option) => typeof option !== 'string'))
    ) {
      return null;
    }
  }

  return test as Test;
}

export async function POST(request: NextRequest) {
  // Rate limit by IP (applies to everyone, defense-in-depth).
  const rateLimit = checkRateLimit(
    'export-test-pdf',
    getClientIp(request),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  // Require authentication.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'You must be signed in to export tests as PDF' },
      { status: 401 }
    );
  }

  // Pro-only feature: verify the subscription server-side.
  try {
    const subscriptionStatus = await getSubscriptionStatus(userId);
    if (subscriptionStatus !== 'active') {
      return NextResponse.json(
        {
          error: 'PDF export is a Pro feature',
          upgradeRequired: true,
          message: 'Upgrade to Pro to export your tests as printable PDFs.',
        },
        { status: 403 }
      );
    }
  } catch (statusError) {
    console.error('Subscription status check error:', statusError);
    return NextResponse.json(
      { error: 'Unable to verify subscription. Please try again.' },
      { status: 500 }
    );
  }

  // Parse and validate the payload.
  let body: ExportRequest | null = null;
  try {
    body = (await request.json()) as ExportRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Resolve the test: either a stored test id (access-checked) or an inline
  // client-supplied object (shape-validated).
  let test: Test | null = null;

  if (typeof body.testId === 'string' && body.testId.trim().length > 0) {
    try {
      const stored = await getTest(body.testId.trim());
      // Every denial is a 404 (never 403) so private-test existence isn't
      // leaked — mirrors GET /api/tests/[id].
      if (!stored) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      const isAdmin = Boolean(
        session?.user?.email && isAdminEmail(session.user.email)
      );
      if (stored.isPublic === false && stored.userId !== userId && !isAdmin) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      test = stored;
    } catch (dbError) {
      console.error('Test fetch error:', dbError);
      return NextResponse.json(
        { error: 'Failed to load the test. Please try again.' },
        { status: 500 }
      );
    }
  } else {
    test = extractValidTest(body);
    if (!test) {
      return NextResponse.json(
        { error: 'Invalid test payload: a title and at least one question are required' },
        { status: 400 }
      );
    }
  }

  // Render the PDF.
  try {
    const includeAnswerKey = body.includeAnswerKey !== false;
    const pdfBytes = await generateTestPdf(test, { includeAnswerKey });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${buildPdfFilename(test.title)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (renderError) {
    console.error('PDF render error:', renderError);
    return NextResponse.json(
      { error: 'Failed to generate the PDF. Please try again.' },
      { status: 500 }
    );
  }
}

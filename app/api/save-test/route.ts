import { NextRequest, NextResponse } from 'next/server';
import { saveTest, getTestOwner } from '@/lib/database';
import { Test } from '@/lib/types';
import { mapDifficultyForDatabase } from '@/lib/difficulty';
import { isAdminEmail } from '@/lib/admin-auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Basic abuse protection
    const identity = getClientIp(request);
    const rateLimit = checkRateLimit('save-test', identity, 30, 60 * 1000);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

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

    // Ownership check: an existing test can only be overwritten by its
    // owner or an admin
    const session = await auth();
    const userId = session?.user?.id;
    const existing = await getTestOwner(test.id);
    if (
      existing &&
      existing.userId &&
      existing.userId !== userId &&
      !(session?.user?.email && isAdminEmail(session.user.email))
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this test' },
        { status: 403 }
      );
    }

    // Map competition level to database-compatible difficulty
    const testToSave = {
      ...test,
      difficulty: mapDifficultyForDatabase(test.difficulty),
    } as Test;

    // Save test to database, attributing it to the signed-in user
    try {
      await saveTest(testToSave, undefined, undefined, userId);
    } catch (dbError) {
      console.error('Database error:', dbError);
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

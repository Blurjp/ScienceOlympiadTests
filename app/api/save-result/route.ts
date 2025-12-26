import { NextRequest, NextResponse } from 'next/server';
import { saveTestResult } from '@/lib/database';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { testId, score, totalPoints, percentage, correctAnswers, totalQuestions, timeSpent } = body;

    if (!testId || score === undefined || totalPoints === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user ID from server session (more reliable than client-provided)
    const session = await auth();
    const userId = session?.user?.id;

    const result = await saveTestResult({
      id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testId,
      userId: userId || undefined,
      score,
      totalPoints,
      percentage: percentage || Math.round((score / totalPoints) * 100),
      correctAnswers: correctAnswers || 0,
      totalQuestions: totalQuestions || 0,
      timeSpent: timeSpent || 0,
    });

    return NextResponse.json({ success: true, result, userId: userId || null });
  } catch (error) {
    console.error('Error saving test result:', error);
    return NextResponse.json(
      { error: 'Failed to save test result' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTestResults, getTest } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    console.log('History API - session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', debug: { hasSession: !!session, hasUser: !!session?.user } },
        { status: 401 }
      );
    }

    const results = await getUserTestResults(session.user.id);
    console.log('History API - found results:', results.length);

    // Fetch test details for each result
    const resultsWithTests = await Promise.all(
      results.map(async (result) => {
        const test = await getTest(result.testId);
        return {
          id: result.id,
          testId: result.testId,
          testTitle: test?.title || 'Unknown Test',
          testTopic: test?.topic || 'Unknown',
          score: result.score,
          totalPoints: result.totalPoints,
          percentage: result.percentage,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions,
          timeSpent: result.timeSpent,
          completedAt: result.completedAt || new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({ results: resultsWithTests });
  } catch (error: any) {
    console.error('Error fetching history:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error?.message },
      { status: 500 }
    );
  }
}

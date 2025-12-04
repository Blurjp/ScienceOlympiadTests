import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTestResults, getTest } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = await getUserTestResults(session.user.id);

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
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

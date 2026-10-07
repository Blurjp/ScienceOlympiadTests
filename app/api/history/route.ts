import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTestResults, getTestSummaries } from '@/lib/database';

export const dynamic = 'force-dynamic';

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

    // Fetch test titles/topics for all results in one batched query
    const summaries = await getTestSummaries(results.map((r) => r.testId));

    const resultsWithTests = results.map((result) => {
      const summary = summaries.get(result.testId);
      return {
        id: result.id,
        testId: result.testId,
        testTitle: summary?.title || 'Unknown Test',
        testTopic: summary?.topic || 'Unknown',
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent,
        completedAt: result.completedAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({ results: resultsWithTests });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

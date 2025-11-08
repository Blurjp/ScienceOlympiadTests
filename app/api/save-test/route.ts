import { NextRequest, NextResponse } from 'next/server';
import { saveTest } from '@/lib/database';
import { Test } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
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

import { NextRequest, NextResponse } from 'next/server';
import { getAllTests, getTestsByYear, getTestsByTopic, getAvailableYears, getAvailableTopics } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const topic = searchParams.get('topic');
    const action = searchParams.get('action');

    // Get available years
    if (action === 'years') {
      const years = getAvailableYears();
      return NextResponse.json({ years });
    }

    // Get available topics
    if (action === 'topics') {
      const topics = getAvailableTopics();
      return NextResponse.json({ topics });
    }

    // Get tests with filters
    let tests;
    if (year) {
      tests = getTestsByYear(parseInt(year));
    } else if (topic) {
      tests = getTestsByTopic(topic);
    } else {
      tests = getAllTests();
    }

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests from database' },
      { status: 500 }
    );
  }
}

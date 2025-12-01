import { NextRequest, NextResponse } from 'next/server';
import { getAllTests, getTestsByYear, getTestsByTopic, getTestsByYearAndTopic, getAvailableYears, getAvailableTopics, getAvailableRegions } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const topic = searchParams.get('topic');
    const action = searchParams.get('action');

    // Get available years
    if (action === 'years') {
      const years = await getAvailableYears();
      return NextResponse.json({ years });
    }

    // Get available topics
    if (action === 'topics') {
      const topics = await getAvailableTopics();
      return NextResponse.json({ topics });
    }

    // Get available regions
    if (action === 'regions') {
      const regions = await getAvailableRegions();
      return NextResponse.json({ regions });
    }

    // Get tests with filters
    let tests;
    if (year && topic) {
      // Combined year and topic filter
      tests = await getTestsByYearAndTopic(parseInt(year), topic);
    } else if (year) {
      tests = await getTestsByYear(parseInt(year));
    } else if (topic) {
      tests = await getTestsByTopic(topic);
    } else {
      tests = await getAllTests();
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

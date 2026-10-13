import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAllTests,
  getTestsByYear,
  getTestsByTopic,
  getTestsByYearAndTopic,
  getAvailableYears,
  getAvailableTopics,
  getAvailableRegions,
  searchTests,
} from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const topic = searchParams.get('topic');
    const search = searchParams.get('search')?.trim() || undefined;
    const mine = searchParams.get('mine') === '1';
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

    // "Only my tests" requires a signed-in user
    let userId: string | undefined;
    if (mine) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Please sign in to filter by your own tests.', signInRequired: true },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    // Text search and owner filtering go through the flexible query builder;
    // plain year/topic combos keep using the dedicated helpers.
    if (search || userId) {
      const tests = await searchTests({
        topic: topic || undefined,
        year: year ? parseInt(year) : undefined,
        search,
        userId,
      });
      return NextResponse.json({ tests });
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

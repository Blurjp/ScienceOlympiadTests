import { NextRequest, NextResponse } from 'next/server';
import { getAllTests, getTestsByYear, getTestsByTopic, getAvailableYears, getAvailableTopics } from '@/lib/database';
import { rateLimit, getClientIp, sanitizeError } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`tests-get:${clientIp}`, 30, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

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
    const errorMessage = sanitizeError(error, 'Database error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

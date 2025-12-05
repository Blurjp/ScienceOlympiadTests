import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminEmail } from '@/lib/admin-auth';
import {
  getAdminStats,
  getApiUsageByDay,
  getTopicUsageStats,
  getRecentUsers,
  getRecentApiCalls,
} from '@/lib/database';

// Verify admin session from cookie
function verifyAdminSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie) return false;

  try {
    const session = JSON.parse(cookie.value);
    if (!session.email || !session.expiresAt) return false;
    if (!isAdminEmail(session.email)) return false;
    if (Date.now() > session.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Verify admin session
  if (!verifyAdminSession(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview':
        const stats = await getAdminStats();
        return NextResponse.json({ stats });

      case 'usage-by-day':
        const days = parseInt(searchParams.get('days') || '30');
        const usageByDay = await getApiUsageByDay(days);
        return NextResponse.json({ usageByDay });

      case 'topic-stats':
        const topicStats = await getTopicUsageStats();
        return NextResponse.json({ topicStats });

      case 'recent-users':
        const limit = parseInt(searchParams.get('limit') || '20');
        const recentUsers = await getRecentUsers(limit);
        return NextResponse.json({ recentUsers });

      case 'recent-api-calls':
        const apiLimit = parseInt(searchParams.get('limit') || '50');
        const recentApiCalls = await getRecentApiCalls(apiLimit);
        return NextResponse.json({ recentApiCalls });

      case 'all':
        const [allStats, allUsageByDay, allTopicStats, allRecentUsers, allRecentApiCalls] = await Promise.all([
          getAdminStats(),
          getApiUsageByDay(30),
          getTopicUsageStats(),
          getRecentUsers(20),
          getRecentApiCalls(50),
        ]);
        return NextResponse.json({
          stats: allStats,
          usageByDay: allUsageByDay,
          topicStats: allTopicStats,
          recentUsers: allRecentUsers,
          recentApiCalls: allRecentApiCalls,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

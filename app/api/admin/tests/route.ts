import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminEmail, verifyAdminSessionCookie } from '@/lib/admin-auth';
import { auth } from '@/auth';
import {
  getPageEligibleTestSummaries,
  getTestSummariesByIds,
  setTestIndexable,
} from '@/lib/database';
import { pingIndexNow } from '@/lib/indexnow';
import { buildTestPath } from '@/lib/test-pages';
import { slugifyTopic } from '@/lib/event-pages';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

// Admin access is granted via the signed admin session cookie OR the site's
// NextAuth session when signed in as the admin Google account (same rule as
// /api/admin/stats).
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  if (verifyAdminSessionCookie(request.cookies.get(ADMIN_COOKIE_NAME)?.value) !== null) {
    return true;
  }
  try {
    const session = await auth();
    if (session?.user?.email && isAdminEmail(session.user.email)) {
      return true;
    }
  } catch {
    // NextAuth unavailable, fall through
  }
  return false;
}

/** Page-eligible public tests with their indexable state, for the toggle UI. */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const tests = await getPageEligibleTestSummaries();
    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Failed to load tests for admin:', error);
    return NextResponse.json({ error: 'Failed to load tests' }, { status: 500 });
  }
}

/** Toggle the search-indexing quality bar for one test's public page. */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, indexable } = body as { id?: unknown; indexable?: unknown };
    if (typeof id !== 'string' || typeof indexable !== 'boolean') {
      return NextResponse.json(
        { error: 'Request body must be { id: string, indexable: boolean }' },
        { status: 400 }
      );
    }

    const result = await setTestIndexable(id, indexable);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    // Notify IndexNow engines right away (Bing/Copilot, DuckDuckGo,
    // ChatGPT search) - both directions, so a flipped-off page also gets
    // recrawled to see its new noindex. Fire-and-forget.
    try {
      const [summary] = await getTestSummariesByIds([id]);
      if (summary) {
        const base = getSiteUrl();
        void pingIndexNow(
          [`${base}${buildTestPath(slugifyTopic(summary.topic), id, summary.difficulty)}`],
          new URL(base).host
        );
      }
    } catch {
      // URL build/ping failures never block the toggle itself
    }

    return NextResponse.json({ success: true, id, indexable });
  } catch (error) {
    console.error('Failed to toggle test indexing:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

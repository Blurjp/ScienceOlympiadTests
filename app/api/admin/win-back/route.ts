import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminEmail, verifyAdminSessionCookie } from '@/lib/admin-auth';
import { auth } from '@/auth';
import {
  getWinBackCandidates,
  getPublicTestsSince,
  countWinBackSentSince,
  recordWinBackEmail,
  getRecentWinBackEmails,
  getRecentFeedback,
  WinBackCandidate,
} from '@/lib/database';
import {
  buildWinBackEmail,
  createUnsubscribeToken,
  selectNewTestsForUser,
  sendEmailViaResend,
  NewTestLink,
  NewTestRow,
} from '@/lib/win-back';

export const dynamic = 'force-dynamic';

// Admin access is granted via the signed admin session cookie OR the site's
// NextAuth session when signed in as the admin Google account.
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

function dailyCap(): number {
  const n = parseInt(process.env.WINBACK_DAILY_CAP || '90', 10);
  return Number.isFinite(n) && n > 0 ? n : 90;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://sciolyprep.com'
  ).replace(/\/$/, '');
}

interface EnrichedCandidate extends WinBackCandidate {
  newTestsCount: number;
  newTestTitles: string[];
  newTests: NewTestLink[];
}

async function buildAudience(inactiveDays: number, cooldownDays: number, limit: number) {
  const [candidates, publicTests] = await Promise.all([
    getWinBackCandidates({ inactiveDays, cooldownDays, limit }),
    getPublicTestsSince(365),
  ]);
  const enriched: EnrichedCandidate[] = candidates.map((c) => {
    const { links, totalCount } = selectNewTestsForUser(
      publicTests as unknown as NewTestRow[],
      c.lastActive
    );
    return {
      ...c,
      newTestsCount: totalCount,
      newTestTitles: links.map((l) => l.title),
      newTests: links,
    };
  });
  return { enriched, publicTests };
}

// GET — preview the win-back audience: who would get an email, what's new
// since each user left, cap status, and recent send history.
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const inactiveDays = parseInt(searchParams.get('inactiveDays') || '30', 10) || 30;
    const cooldownDays = parseInt(searchParams.get('cooldownDays') || '30', 10) || 30;
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10) || 200));

    const [{ enriched }, sentLast24h, recentSends, recentFeedback] = await Promise.all([
      buildAudience(inactiveDays, cooldownDays, limit),
      countWinBackSentSince(24),
      getRecentWinBackEmails(20),
      getRecentFeedback(50),
    ]);

    return NextResponse.json({
      inactiveDays,
      cooldownDays,
      dailyCap: dailyCap(),
      sentLast24h,
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      audienceCount: enriched.length,
      candidates: enriched,
      recentSends,
      recentFeedback,
    });
  } catch (error) {
    console.error('Win-back preview error:', error);
    return NextResponse.json({ error: 'Failed to build win-back preview' }, { status: 500 });
  }
}

// POST — send win-back emails. dryRun defaults to true so the button in the
// admin dashboard can never accidentally fire a real campaign.
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { dryRun?: boolean; note?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const dryRun = body.dryRun !== false;
  const note = (body.note || '').trim().slice(0, 500) || null;
  const requestedLimit = Math.min(500, Math.max(1, Math.floor(Number(body.limit) || 50)));

  try {
    const sentLast24h = await countWinBackSentSince(24);
    const cap = dailyCap();
    const remaining = Math.max(0, cap - sentLast24h);
    if (remaining === 0) {
      return NextResponse.json(
        {
          error: `Daily cap reached (${cap} emails in the last 24h). Try again tomorrow or raise WINBACK_DAILY_CAP.`,
        },
        { status: 429 }
      );
    }

    const { enriched } = await buildAudience(30, 30, requestedLimit);
    const toSend = enriched.slice(0, Math.min(requestedLimit, remaining));

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldSend: toSend.length,
        remainingCap: remaining,
        skippedByCap: enriched.length - toSend.length,
        note,
        sample: toSend.slice(0, 3).map((c) => ({
          email: c.email,
          subject: `${c.newTestsCount} new Science Olympiad practice test${c.newTestsCount === 1 ? '' : 's'} since your last visit`,
        })),
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured. Set it in your environment first.' },
        { status: 503 }
      );
    }

    const base = siteUrl();
    let sent = 0;
    let failed = 0;
    const failures: { email: string; error: string }[] = [];

    for (const c of toSend) {
      const email = buildWinBackEmail({
        userName: c.name,
        newTests: c.newTests,
        newTestsCount: c.newTestsCount,
        siteUrl: base,
        note,
        unsubscribeToken: createUnsubscribeToken(c.id),
      });
      const result = await sendEmailViaResend(c.email, email);
      await recordWinBackEmail({
        userId: c.id,
        email: c.email,
        newTestsCount: c.newTestsCount,
        note,
        status: result.ok ? 'sent' : 'failed',
      });
      if (result.ok) sent += 1;
      else {
        failed += 1;
        failures.push({ email: c.email, error: result.error });
      }
    }

    return NextResponse.json({
      dryRun: false,
      attempted: toSend.length,
      sent,
      failed,
      remainingCap: Math.max(0, remaining - sent),
      failures: failures.slice(0, 10),
    });
  } catch (error) {
    console.error('Win-back send error:', error);
    return NextResponse.json({ error: 'Failed to send win-back emails' }, { status: 500 });
  }
}

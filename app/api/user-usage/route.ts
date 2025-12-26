import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserMonthlyAIGenerations, getSubscriptionStatus } from '@/lib/database';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [subscriptionStatus, used] = await Promise.all([
      getSubscriptionStatus(session.user.id),
      getUserMonthlyAIGenerations(session.user.id),
    ]);

    const isPro = subscriptionStatus === 'active';

    return NextResponse.json({
      used,
      limit: FREE_TIER_MONTHLY_LIMIT,
      isPro,
      remaining: isPro ? null : Math.max(FREE_TIER_MONTHLY_LIMIT - used, 0),
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}

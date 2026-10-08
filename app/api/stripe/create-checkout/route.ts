import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe, PRO_PRICE_ID, SEASON_PASS_PRICE_ID } from '@/lib/stripe';
import { getUserByEmail, updateUserSubscription } from '@/lib/database';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

type Plan = 'pro' | 'season';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      );
    }

    // Determine which plan is being purchased (default: pro subscription)
    let plan: Plan = 'pro';
    try {
      const body = await request.json();
      if (body?.plan === 'season') plan = 'season';
    } catch {
      // No body or invalid JSON — default to pro
    }

    const priceId = plan === 'season' ? SEASON_PASS_PRICE_ID : PRO_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price for "${plan}" plan is not configured` },
        { status: 500 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription or season pass
    if (user.subscriptionStatus === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // Cost-abuse protection: cap checkout session creation per user
    const rateLimit = checkRateLimit('stripe-checkout', user.id, 5, 60 * 1000);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await updateUserSubscription(user.id, {
        stripeCustomerId: customerId,
      });
    }

    // Determine the origin for redirect URLs. Prefer the configured site URL;
    // only fall back to the request Origin if it is unset (dev environments).
    // Trusting the client-supplied Origin blindly would allow open redirects
    // from Stripe checkout to attacker-controlled hosts.
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
      || process.env.AUTH_URL
      || process.env.NEXTAUTH_URL;
    let origin: string;
    if (configuredOrigin) {
      origin = configuredOrigin.replace(/\/$/, '');
    } else {
      const requestOrigin = request.headers.get('origin');
      origin = requestOrigin?.startsWith('http') ? requestOrigin : 'http://localhost:3000';
    }

    // Create checkout session (subscription for Pro, one-time payment for Season Pass).
    // The idempotency key buckets by user+plan+minute so double-clicks and network
    // retries replay the same session instead of creating (and potentially charging) duplicates.
    const idempotencyKey = `checkout:${user.id}:${plan}:${Math.floor(Date.now() / 60_000)}`;
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: plan === 'season' ? 'payment' : 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/profile?subscription=success`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          plan,
        },
        ...(plan === 'pro'
          ? {
              subscription_data: {
                metadata: {
                  userId: user.id,
                  plan,
                },
              },
            }
          : {}),
      },
      { idempotencyKey }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

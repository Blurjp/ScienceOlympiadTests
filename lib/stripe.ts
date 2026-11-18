import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility, export a getter
export const stripe = {
  get customers() {
    return getStripe().customers;
  },
  get checkout() {
    return getStripe().checkout;
  },
  get subscriptions() {
    return getStripe().subscriptions;
  },
  get billingPortal() {
    return getStripe().billingPortal;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
};

// Price ID for Pro subscription ($4.99/month)
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';

// Price ID for Season Pass (one-time $19.99, valid Sep 1 - May 31)
export const SEASON_PASS_PRICE_ID = process.env.STRIPE_SEASON_PASS_PRICE_ID || '';

// Free tier monthly AI generation limit
export const FREE_TIER_MONTHLY_LIMIT = 5;

/**
 * Season Pass end date: May 31 of the current competition season.
 * Purchases Jan-May end May 31 of that year; Jun-Dec purchases cover
 * the upcoming season and end May 31 of the next year.
 */
export function getSeasonEnd(from: Date = new Date()): Date {
  const year = from.getFullYear();
  const endYear = from.getMonth() >= 5 ? year + 1 : year; // month is 0-indexed: 5 = June
  // Season ends at 23:59:59 UTC on May 31
  return new Date(Date.UTC(endYear, 4, 31, 23, 59, 59));
}

// ---------------------------------------------------------------------------
// Black Friday 2026 promotion: 50% off both plans during the promo window
// (see lib/promotion.ts). The coupon is created with an explicit id, so
// ensuring it is idempotent across cold starts and instances.
// ---------------------------------------------------------------------------

const BLACK_FRIDAY_COUPON_ID = 'black-friday-2026';
let promotionCouponId: string | null = null;

/**
 * Ensure the Black Friday coupon exists and return its id.
 *
 * Creating with an explicit id makes repeated calls idempotent: a duplicate
 * error means the coupon already exists and we reuse it. `duration: forever`
 * locks 50% off for the life of subscriptions started during the window;
 * for the one-time Season Pass the coupon simply halves the single charge.
 *
 * Never throws: returns null on failure so checkout proceeds undiscounted —
 * the promotion is a bonus, not something worth blocking payment over.
 */
export async function getPromotionCouponId(): Promise<string | null> {
  if (promotionCouponId) return promotionCouponId;
  try {
    await getStripe().coupons.create({
      id: BLACK_FRIDAY_COUPON_ID,
      percent_off: 50,
      duration: 'forever',
      name: 'Black Friday 2026 - 50% off',
    });
    promotionCouponId = BLACK_FRIDAY_COUPON_ID;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    const message = (error as { message?: string })?.message || '';
    if (code === 'resource_already_exists' || /already exist/i.test(message)) {
      promotionCouponId = BLACK_FRIDAY_COUPON_ID;
    } else {
      console.error('Failed to ensure Black Friday coupon:', message);
      return null;
    }
  }
  return promotionCouponId;
}

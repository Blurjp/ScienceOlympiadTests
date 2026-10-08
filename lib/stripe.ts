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

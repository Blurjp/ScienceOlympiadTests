/**
 * Site-wide promotion state (currently: Black Friday 2026).
 *
 * Pure date logic with env overrides — safe to import from both server
 * routes (checkout) and client components (pricing page, banners).
 *
 * Env controls:
 *   PROMO_DISABLED=1        kill switch (default: off = promotion may run)
 *   PROMO_START_UTC / PROMO_END_UTC   ISO dates overriding the built-in window
 */

export interface ActivePromotion {
  name: string;
  percentOff: number;
  startsAt: Date;
  endsAt: Date;
}

// Black Friday 2026 through Cyber Monday, midnight-to-midnight ET.
// (US Eastern is UTC-5 in late November, after DST ends.)
const DEFAULT_START_UTC = '2026-11-27T05:00:00Z';
const DEFAULT_END_UTC = '2026-12-01T05:00:00Z';

const BLACK_FRIDAY_2026: Omit<ActivePromotion, 'startsAt' | 'endsAt'> = {
  name: 'Black Friday',
  percentOff: 50,
};

/** The active promotion for `now`, or null outside the window. */
export function getActivePromotion(now: Date = new Date()): ActivePromotion | null {
  if (process.env.PROMO_DISABLED === '1' || process.env.PROMO_DISABLED === 'true') {
    return null;
  }
  const start = new Date(process.env.PROMO_START_UTC || DEFAULT_START_UTC);
  const end = new Date(process.env.PROMO_END_UTC || DEFAULT_END_UTC);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  if (now < start || now >= end) return null;
  return { ...BLACK_FRIDAY_2026, startsAt: start, endsAt: end };
}

/**
 * Format the displayed price for a base dollar amount under a promotion.
 * Rounds half-up in cents so $4.99 → "$2.50" (matching Stripe's invoice
 * rounding for percent_off discounts) rather than "$2.49".
 */
export function formatDiscountedPrice(
  baseDollars: number,
  promotion: ActivePromotion | null
): string {
  if (!promotion || promotion.percentOff <= 0) return `$${baseDollars.toFixed(2)}`;
  const cents = Math.round(baseDollars * 100);
  const discountedCents = Math.round((cents * (100 - promotion.percentOff)) / 100);
  return `$${(discountedCents / 100).toFixed(2)}`;
}

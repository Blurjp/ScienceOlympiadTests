/**
 * Tests for lib/promotion.ts — Black Friday 2026 promotion window and
 * discounted price formatting.
 */
import { getActivePromotion, formatDiscountedPrice } from '@/lib/promotion';

const DURING = new Date('2026-11-28T15:00:00Z'); // Saturday of the sale
const BEFORE = new Date('2026-11-26T15:00:00Z');
const AFTER = new Date('2026-12-01T12:00:00Z'); // after Cyber Monday (ET)

describe('getActivePromotion', () => {
  const ENV_KEYS = ['PROMO_DISABLED', 'PROMO_START_UTC', 'PROMO_END_UTC'];

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterAll(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  test('active during the Black Friday window', () => {
    const promo = getActivePromotion(DURING);
    expect(promo).not.toBeNull();
    expect(promo?.name).toBe('Black Friday');
    expect(promo?.percentOff).toBe(50);
  });

  test('inactive before the window', () => {
    expect(getActivePromotion(BEFORE)).toBeNull();
  });

  test('inactive after the window', () => {
    expect(getActivePromotion(AFTER)).toBeNull();
  });

  test('starts at midnight ET on Nov 27 (05:00 UTC)', () => {
    expect(getActivePromotion(new Date('2026-11-27T04:59:59Z'))).toBeNull();
    expect(getActivePromotion(new Date('2026-11-27T05:00:00Z'))).not.toBeNull();
  });

  test('ends at midnight ET on Dec 1 (exclusive)', () => {
    expect(getActivePromotion(new Date('2026-11-30T23:59:59-05:00'))).not.toBeNull();
    expect(getActivePromotion(new Date('2026-12-01T05:00:00Z'))).toBeNull();
  });

  test('PROMO_DISABLED kill switch turns it off mid-window', () => {
    process.env.PROMO_DISABLED = '1';
    expect(getActivePromotion(DURING)).toBeNull();

    process.env.PROMO_DISABLED = 'true';
    expect(getActivePromotion(DURING)).toBeNull();
  });

  test('PROMO_START_UTC / PROMO_END_UTC override the window', () => {
    process.env.PROMO_START_UTC = '2026-06-01T00:00:00Z';
    process.env.PROMO_END_UTC = '2026-06-30T00:00:00Z';
    expect(getActivePromotion(DURING)).toBeNull();
    expect(getActivePromotion(new Date('2026-06-15T00:00:00Z'))).not.toBeNull();
  });

  test('an invalid env window disables the promotion rather than throwing', () => {
    process.env.PROMO_START_UTC = 'not-a-date';
    expect(getActivePromotion(DURING)).toBeNull();

    delete process.env.PROMO_START_UTC;
    process.env.PROMO_END_UTC = '2026-11-01T00:00:00Z'; // end before default start
    expect(getActivePromotion(DURING)).toBeNull();
  });
});

describe('formatDiscountedPrice', () => {
  test('halves prices rounding half-up in cents (Stripe invoice behavior)', () => {
    const promo = getActivePromotion(DURING);
    expect(formatDiscountedPrice(4.99, promo)).toBe('$2.50');
    expect(formatDiscountedPrice(19.99, promo)).toBe('$10.00');
  });

  test('returns the base price outside a promotion', () => {
    expect(formatDiscountedPrice(4.99, null)).toBe('$4.99');
    expect(formatDiscountedPrice(19.99, getActivePromotion(BEFORE))).toBe('$19.99');
  });
});

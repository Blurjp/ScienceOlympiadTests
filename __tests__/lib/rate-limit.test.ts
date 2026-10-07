/**
 * Tests for lib/rate-limit.ts
 */
import { checkRateLimit, clearRateLimits, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  test('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit('test-scope', 'ip-1', 5, 1000);
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks requests over the limit', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-scope-2', 'ip-1', 5, 1000);
    }
    const result = checkRateLimit('test-scope-2', 'ip-1', 5, 1000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('tracks remaining count', () => {
    checkRateLimit('test-scope-3', 'ip-1', 3, 1000);
    checkRateLimit('test-scope-3', 'ip-1', 3, 1000);
    const result = checkRateLimit('test-scope-3', 'ip-1', 3, 1000);
    expect(result.remaining).toBe(0);
    expect(result.allowed).toBe(true);
  });

  test('isolates buckets by scope and key', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-scope-4', 'ip-1', 5, 1000);
    }
    // Different key: allowed
    expect(checkRateLimit('test-scope-4', 'ip-2', 5, 1000).allowed).toBe(true);
    // Different scope: allowed
    expect(checkRateLimit('test-scope-5', 'ip-1', 5, 1000).allowed).toBe(true);
    // Original bucket: blocked
    expect(checkRateLimit('test-scope-4', 'ip-1', 5, 1000).allowed).toBe(false);
  });

  test('resets after the window passes', () => {
    jest.useFakeTimers();
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-scope-6', 'ip-1', 5, 1000);
    }
    expect(checkRateLimit('test-scope-6', 'ip-1', 5, 1000).allowed).toBe(false);

    jest.advanceTimersByTime(1100);
    expect(checkRateLimit('test-scope-6', 'ip-1', 5, 1000).allowed).toBe(true);
    jest.useRealTimers();
  });
});

describe('getClientIp', () => {
  test('prefers the first x-forwarded-for entry', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  test('uses x-real-ip when forwarded-for is absent', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(getClientIp(request)).toBe('9.9.9.9');
  });

  test('falls back to unknown', () => {
    const request = new Request('https://example.com');
    expect(getClientIp(request)).toBe('unknown');
  });
});

describe('rateLimitResponse', () => {
  test('returns a 429 with Retry-After', async () => {
    const response = rateLimitResponse(Date.now() + 5000);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('5');
    const data = await response.json();
    expect(data.error).toContain('Too many requests');
  });
});

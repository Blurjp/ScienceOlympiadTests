// Simple in-memory fixed-window rate limiter.
// Suitable for single-instance deployments; for multi-instance serverless
// environments, back this with a shared store (e.g. Upstash Redis).

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Periodically evict expired entries so the map doesn't grow unbounded
const EVICT_INTERVAL_MS = 10 * 60 * 1000;
let lastEviction = 0;

function evictExpired(now: number) {
  if (now - lastEviction < EVICT_INTERVAL_MS) return;
  lastEviction = now;
  buckets.forEach((entry, key) => {
    if (entry.resetAt <= now) buckets.delete(key);
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and consume one unit from a fixed-window rate limit bucket.
 * @param scope   Logical bucket name (e.g. 'admin-login', 'generate-ai-test')
 * @param key     Identity within the scope (user id or IP)
 * @param limit   Max requests per window
 * @param windowMs Window length in milliseconds
 */
export function checkRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  evictExpired(now);

  const bucketKey = `${scope}:${key}`;
  const entry = buckets.get(bucketKey);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Extract the best-effort client IP from a Next.js request. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Test helper: clear all rate limit state. */
export function clearRateLimits() {
  buckets.clear();
}

/** Build a NextResponse-friendly JSON error for rate limit hits. */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

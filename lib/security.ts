import { lookup } from 'dns/promises';

/**
 * Security utilities for preventing SSRF and other vulnerabilities
 */

// Private IP ranges that should be blocked
const PRIVATE_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Invalid
  /^::1$/,                     // IPv6 loopback
  /^fe80:/i,                   // IPv6 link-local
  /^fc00:/i,                   // IPv6 unique local
  /^fd00:/i,                   // IPv6 unique local
];

// Cloud metadata endpoints to block
const BLOCKED_HOSTNAMES = [
  'metadata.google.internal',
  '169.254.169.254',           // AWS, Azure, GCP metadata
  'metadata',
  'localhost',
];

/**
 * Validates that a URL is safe to fetch (prevents SSRF attacks)
 * @param urlString The URL string to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export async function validateSafeUrl(
  urlString: string
): Promise<{ isValid: boolean; error?: string }> {
  let url: URL;

  // Parse URL
  try {
    url = new URL(urlString);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTPS protocol
  if (url.protocol !== 'https:') {
    return {
      isValid: false,
      error: 'Only HTTPS URLs are allowed for security reasons'
    };
  }

  // Check for blocked hostnames
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.some(blocked => hostname.includes(blocked))) {
    return {
      isValid: false,
      error: 'This hostname is not allowed'
    };
  }

  // Check if hostname is an IP address
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
    // Direct IP access - check if it's private
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return {
          isValid: false,
          error: 'Access to private IP addresses is not allowed'
        };
      }
    }
  }

  // Resolve hostname to IP to prevent DNS rebinding attacks
  try {
    const addresses = await lookup(hostname, { all: true });

    for (const addr of addresses) {
      const ip = addr.address;

      // Check if resolved IP is in private range
      for (const range of PRIVATE_IP_RANGES) {
        if (range.test(ip)) {
          return {
            isValid: false,
            error: 'This URL resolves to a private IP address and is not allowed'
          };
        }
      }
    }
  } catch (dnsError) {
    return {
      isValid: false,
      error: 'Failed to resolve hostname'
    };
  }

  // URL is safe
  return { isValid: true };
}

/**
 * Sanitizes error messages to prevent information disclosure
 * @param error The error object or message
 * @param userMessage Generic message to show to users
 * @returns Sanitized error message for users
 */
export function sanitizeError(
  error: unknown,
  userMessage: string = 'An error occurred'
): string {
  // Log the full error server-side (this would go to your logging system)
  if (error instanceof Error) {
    console.error(`[Error] ${userMessage}:`, error.message, error.stack);
  } else {
    console.error(`[Error] ${userMessage}:`, error);
  }

  // Return generic message to user
  return userMessage;
}

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter
 * @param identifier Unique identifier (IP, user ID, etc.)
 * @param maxRequests Maximum requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns Object with allowed boolean and remaining count
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  // Within existing window
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Gets client IP from request (handles proxies)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Validates CSRF protection by checking request origin
 * @param request The incoming request
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateCsrf(request: Request): { isValid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // For API routes, we expect either origin or referer to be present
  if (!origin && !referer) {
    return {
      isValid: false,
      error: 'Missing origin header'
    };
  }

  // Extract hostname from origin or referer
  let requestOrigin: string;
  try {
    if (origin) {
      requestOrigin = new URL(origin).host;
    } else if (referer) {
      requestOrigin = new URL(referer).host;
    } else {
      return { isValid: false, error: 'Invalid request origin' };
    }
  } catch {
    return { isValid: false, error: 'Invalid request origin' };
  }

  // Check if origin matches host
  if (host && requestOrigin !== host) {
    return {
      isValid: false,
      error: 'Origin mismatch - potential CSRF attack'
    };
  }

  return { isValid: true };
}

/**
 * Tests for lib/admin-auth.ts
 */
import {
  validateAdminCredentials,
  isAdminEmail,
  createAdminSessionCookieValue,
  verifyAdminSessionCookie,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION,
  AdminSession,
} from '@/lib/admin-auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!; // set in jest.setup.js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

describe('validateAdminCredentials', () => {
  test('returns true for valid admin credentials', () => {
    const result = validateAdminCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(result).toBe(true);
  });

  test('returns false for invalid email', () => {
    const result = validateAdminCredentials('wrong@email.com', ADMIN_PASSWORD);
    expect(result).toBe(false);
  });

  test('returns false for invalid password', () => {
    const result = validateAdminCredentials(ADMIN_EMAIL, 'wrongpassword');
    expect(result).toBe(false);
  });

  test('returns false for both invalid', () => {
    const result = validateAdminCredentials('wrong@email.com', 'wrongpassword');
    expect(result).toBe(false);
  });

  test('returns false for empty email', () => {
    const result = validateAdminCredentials('', ADMIN_PASSWORD);
    expect(result).toBe(false);
  });

  test('returns false for empty password', () => {
    const result = validateAdminCredentials(ADMIN_EMAIL, '');
    expect(result).toBe(false);
  });

  test('is case insensitive for email', () => {
    const result = validateAdminCredentials(ADMIN_EMAIL.toUpperCase(), ADMIN_PASSWORD);
    expect(result).toBe(true);
  });

  test('is case sensitive for password', () => {
    const result = validateAdminCredentials(ADMIN_EMAIL, ADMIN_PASSWORD.toUpperCase());
    expect(result).toBe(false);
  });
});

describe('isAdminEmail', () => {
  test('returns true for admin email', () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
  });

  test('returns false for non-admin email', () => {
    expect(isAdminEmail('other@email.com')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isAdminEmail('')).toBe(false);
  });

  test('is case insensitive', () => {
    expect(isAdminEmail(ADMIN_EMAIL.toUpperCase())).toBe(true);
  });

  test('returns false for partial match', () => {
    expect(isAdminEmail(ADMIN_EMAIL.split('@')[0])).toBe(false);
  });
});

describe('admin session cookies', () => {
  const validSession: AdminSession = {
    email: ADMIN_EMAIL,
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  test('round-trips a valid session', () => {
    const cookie = createAdminSessionCookieValue(validSession);
    const verified = verifyAdminSessionCookie(cookie);
    expect(verified).not.toBeNull();
    expect(verified!.email).toBe(ADMIN_EMAIL);
    expect(verified!.authenticated).toBe(true);
  });

  test('rejects a tampered payload', () => {
    const cookie = createAdminSessionCookieValue(validSession);
    const [payload, signature] = cookie.split('.');
    const tampered = Buffer.from(
      JSON.stringify({ ...validSession, expiresAt: Date.now() + 9999999999999 })
    ).toString('base64url');
    expect(verifyAdminSessionCookie(`${tampered}.${signature}`)).toBeNull();
    expect(payload).not.toBe(tampered);
  });

  test('rejects a cookie signed for a different payload', () => {
    const cookieA = createAdminSessionCookieValue(validSession);
    const otherSession: AdminSession = {
      email: 'someone-else@test.com',
      authenticated: true,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    const cookieB = createAdminSessionCookieValue(otherSession);
    // Swapping signatures must fail
    const sigA = cookieA.split('.')[1];
    const payloadB = cookieB.split('.')[0];
    expect(verifyAdminSessionCookie(`${payloadB}.${sigA}`)).toBeNull();
  });

  test('rejects a forged unsigned cookie (the old vulnerability)', () => {
    const forged = JSON.stringify({
      token: 'x',
      email: ADMIN_EMAIL,
      expiresAt: Date.now() + 9999999999999,
    });
    expect(verifyAdminSessionCookie(forged)).toBeNull();
  });

  test('rejects an expired session', () => {
    const expired: AdminSession = {
      email: ADMIN_EMAIL,
      authenticated: true,
      expiresAt: Date.now() - 1000,
    };
    const cookie = createAdminSessionCookieValue(expired);
    expect(verifyAdminSessionCookie(cookie)).toBeNull();
  });

  test('rejects garbage input', () => {
    expect(verifyAdminSessionCookie(undefined)).toBeNull();
    expect(verifyAdminSessionCookie('')).toBeNull();
    expect(verifyAdminSessionCookie('not-a-cookie')).toBeNull();
    expect(verifyAdminSessionCookie('a.b.c.d')).toBeNull();
  });

  test('cookie value is non-trivially long', () => {
    const cookie = createAdminSessionCookieValue(validSession);
    expect(cookie.length).toBeGreaterThan(50);
  });
});

describe('Constants', () => {
  test('ADMIN_COOKIE_NAME is defined', () => {
    expect(ADMIN_COOKIE_NAME).toBe('admin_session');
  });

  test('SESSION_DURATION is 24 hours in milliseconds', () => {
    const expectedDuration = 24 * 60 * 60 * 1000;
    expect(SESSION_DURATION).toBe(expectedDuration);
  });
});

describe('AdminSession interface', () => {
  test('can create valid AdminSession object', () => {
    const session: AdminSession = {
      email: 'admin@test.com',
      authenticated: true,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    expect(session.email).toBe('admin@test.com');
    expect(session.authenticated).toBe(true);
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });
});

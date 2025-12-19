/**
 * Tests for lib/admin-auth.ts
 */
import {
  validateAdminCredentials,
  isAdminEmail,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION,
  AdminSession,
} from '@/lib/admin-auth';

describe('validateAdminCredentials', () => {
  test('returns true for valid admin credentials', () => {
    const result = validateAdminCredentials('blurjp@gmail.com', '1qaz2wsx#E$R');
    expect(result).toBe(true);
  });

  test('returns false for invalid email', () => {
    const result = validateAdminCredentials('wrong@email.com', '1qaz2wsx#E$R');
    expect(result).toBe(false);
  });

  test('returns false for invalid password', () => {
    const result = validateAdminCredentials('blurjp@gmail.com', 'wrongpassword');
    expect(result).toBe(false);
  });

  test('returns false for both invalid', () => {
    const result = validateAdminCredentials('wrong@email.com', 'wrongpassword');
    expect(result).toBe(false);
  });

  test('returns false for empty email', () => {
    const result = validateAdminCredentials('', '1qaz2wsx#E$R');
    expect(result).toBe(false);
  });

  test('returns false for empty password', () => {
    const result = validateAdminCredentials('blurjp@gmail.com', '');
    expect(result).toBe(false);
  });

  test('is case sensitive for email', () => {
    const result = validateAdminCredentials('BLURJP@GMAIL.COM', '1qaz2wsx#E$R');
    expect(result).toBe(false);
  });

  test('is case sensitive for password', () => {
    const result = validateAdminCredentials('blurjp@gmail.com', '1QAZ2WSX#E$R');
    expect(result).toBe(false);
  });
});

describe('isAdminEmail', () => {
  test('returns true for admin email', () => {
    expect(isAdminEmail('blurjp@gmail.com')).toBe(true);
  });

  test('returns false for non-admin email', () => {
    expect(isAdminEmail('other@email.com')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isAdminEmail('')).toBe(false);
  });

  test('is case sensitive', () => {
    expect(isAdminEmail('BLURJP@GMAIL.COM')).toBe(false);
  });

  test('returns false for partial match', () => {
    expect(isAdminEmail('blurjp@gmail')).toBe(false);
  });
});

describe('generateAdminToken', () => {
  test('generates a string token', () => {
    const token = generateAdminToken();
    expect(typeof token).toBe('string');
  });

  test('token starts with admin_ prefix', () => {
    const token = generateAdminToken();
    expect(token.startsWith('admin_')).toBe(true);
  });

  test('generates unique tokens', () => {
    const token1 = generateAdminToken();
    const token2 = generateAdminToken();
    expect(token1).not.toBe(token2);
  });

  test('token contains underscore separators', () => {
    const token = generateAdminToken();
    const parts = token.split('_');
    expect(parts.length).toBe(3);
  });

  test('generates many unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateAdminToken());
    }
    expect(tokens.size).toBe(100);
  });

  test('token has reasonable length', () => {
    const token = generateAdminToken();
    expect(token.length).toBeGreaterThan(15);
    expect(token.length).toBeLessThan(50);
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

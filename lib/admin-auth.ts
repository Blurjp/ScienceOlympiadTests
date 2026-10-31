// Admin authentication configuration
// Credentials and session secret are read from environment variables.
// Generate a strong password: openssl rand -base64 24
import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'admin_session';

// The single account allowed to access the admin dashboard.
// Can be overridden with the ADMIN_EMAIL env var.
export const ADMIN_EMAIL_DEFAULT = 'blurjp@gmail.com';

// Session duration: 24 hours
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

export interface AdminSession {
  email: string;
  authenticated: boolean;
  expiresAt: number;
}

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT;
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ''
  );
}

// Constant-time string comparison to avoid timing attacks
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Burn the same time as a real comparison, then fail
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  if (!adminEmail || !adminPassword) return false;
  return (
    timingSafeEqualStr(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
    timingSafeEqualStr(password, adminPassword)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  return timingSafeEqualStr(email.trim().toLowerCase(), adminEmail.trim().toLowerCase());
}

// Create an HMAC-signed session cookie value.
// The signature makes the cookie unforgeable without the session secret.
export function createAdminSessionCookieValue(session: AdminSession): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('Admin session secret is not configured (set ADMIN_SESSION_SECRET or AUTH_SECRET)');
  }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

// Verify an admin session cookie value and return the session, or null if
// invalid, tampered with, or expired.
export function verifyAdminSessionCookie(value: string | undefined): AdminSession | null {
  if (!value) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  if (!timingSafeEqualStr(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSession;
    if (!session.email || !session.expiresAt) return null;
    if (!isAdminEmail(session.email)) return null;
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

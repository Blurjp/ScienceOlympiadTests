// Admin authentication configuration
// Only these credentials can access the admin dashboard

const ADMIN_EMAIL = 'blurjp@gmail.com';
const ADMIN_PASSWORD = '1qaz2wsx#E$R';

export interface AdminSession {
  email: string;
  authenticated: boolean;
  expiresAt: number;
}

// Simple password hashing for comparison (in production, use bcrypt)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export function isAdminEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// Session token generation (simple implementation)
export function generateAdminToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `admin_${timestamp}_${random}`;
}

// Cookie name for admin session
export const ADMIN_COOKIE_NAME = 'admin_session';

// Session duration: 24 hours
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

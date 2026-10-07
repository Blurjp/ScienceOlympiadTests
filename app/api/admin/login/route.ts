import { NextRequest, NextResponse } from 'next/server';
import {
  validateAdminCredentials,
  createAdminSessionCookieValue,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION,
} from '@/lib/admin-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Brute-force protection: 5 attempts per IP per 15 minutes
    const rateLimit = checkRateLimit('admin-login', getClientIp(request), 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const expiresAt = Date.now() + SESSION_DURATION;

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
    });

    // Set signed, httpOnly cookie
    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createAdminSessionCookieValue({ email, authenticated: true, expiresAt }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION / 1000, // in seconds
        path: '/',
      }
    );

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

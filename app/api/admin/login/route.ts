import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, generateAdminToken, ADMIN_COOKIE_NAME, SESSION_DURATION } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
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

    // Generate session token
    const token = generateAdminToken();
    const expiresAt = Date.now() + SESSION_DURATION;

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
    });

    // Set secure cookie
    response.cookies.set(ADMIN_COOKIE_NAME, JSON.stringify({ token, email, expiresAt }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000, // in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

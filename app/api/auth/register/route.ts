import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { rateLimit, getClientIp, sanitizeError, validateCsrf } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfValidation = validateCsrf(request);
    if (!csrfValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // Rate limiting: 5 registrations per hour per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`register:${clientIp}`, 5, 3600000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userId = generateId();
    createUser(userId, email, name, passwordHash);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = sanitizeError(error, 'Registration error');
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

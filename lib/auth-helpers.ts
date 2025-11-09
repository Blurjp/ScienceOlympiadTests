import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Gets the current session from NextAuth
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Checks if the user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return (session?.user as any)?.role === 'admin';
}

/**
 * Middleware to require authentication
 * Returns null if authenticated, or error response if not
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Middleware to require admin role
 * Returns null if user is admin, or error response if not
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const authError = await requireAuth();
  if (authError) return authError;

  const admin = await isAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return null;
}

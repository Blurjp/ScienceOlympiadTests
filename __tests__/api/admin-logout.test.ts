/**
 * Tests for app/api/admin/logout/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/logout/route';

describe('POST /api/admin/logout', () => {
  test('returns success message', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Logged out successfully');
  });

  test('clears admin session cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const cookies = response.cookies;
    const adminCookie = cookies.get('admin_session');

    expect(adminCookie).toBeDefined();
    expect(adminCookie?.value).toBe('');
    expect(adminCookie?.maxAge).toBe(0);
  });

  test('sets secure cookie options', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const cookies = response.cookies;
    const adminCookie = cookies.get('admin_session');

    expect(adminCookie?.httpOnly).toBe(true);
    expect(adminCookie?.sameSite).toBe('strict');
    expect(adminCookie?.path).toBe('/');
  });
});

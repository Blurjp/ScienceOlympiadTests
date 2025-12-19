/**
 * Tests for app/api/admin/login/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/login/route';

// Helper to create a mock NextRequest with JSON body
function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('POST /api/admin/login', () => {
  describe('successful login', () => {
    test('returns success for valid credentials', async () => {
      const request = createMockRequest({
        email: 'blurjp@gmail.com',
        password: '1qaz2wsx#E$R',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged in successfully');
    });

    test('sets admin cookie on successful login', async () => {
      const request = createMockRequest({
        email: 'blurjp@gmail.com',
        password: '1qaz2wsx#E$R',
      });

      const response = await POST(request);
      const cookies = response.cookies;
      const adminCookie = cookies.get('admin_session');

      expect(adminCookie).toBeDefined();
      expect(adminCookie?.httpOnly).toBe(true);
    });
  });

  describe('validation errors', () => {
    test('returns 400 for missing email', async () => {
      const request = createMockRequest({
        password: '1qaz2wsx#E$R',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    test('returns 400 for missing password', async () => {
      const request = createMockRequest({
        email: 'blurjp@gmail.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    test('returns 400 for empty body', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });
  });

  describe('authentication errors', () => {
    test('returns 401 for invalid email', async () => {
      const request = createMockRequest({
        email: 'wrong@email.com',
        password: '1qaz2wsx#E$R',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    test('returns 401 for invalid password', async () => {
      const request = createMockRequest({
        email: 'blurjp@gmail.com',
        password: 'wrongpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('error handling', () => {
    test('returns 500 for malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: 'not valid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Login failed');
    });
  });
});

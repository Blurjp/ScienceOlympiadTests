/**
 * Tests for app/api/admin/login/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/login/route';
import { clearRateLimits } from '@/lib/rate-limit';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!; // set in jest.setup.js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

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
  beforeEach(() => {
    // Reset the in-memory rate limiter between tests
    clearRateLimits();
  });

  describe('successful login', () => {
    test('returns success for valid credentials', async () => {
      const request = createMockRequest({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged in successfully');
    });

    test('sets admin cookie on successful login', async () => {
      const request = createMockRequest({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
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
        password: ADMIN_PASSWORD,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
    });

    test('returns 400 for missing password', async () => {
      const request = createMockRequest({
        email: ADMIN_EMAIL,
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
        password: ADMIN_PASSWORD,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });

    test('returns 401 for invalid password', async () => {
      const request = createMockRequest({
        email: ADMIN_EMAIL,
        password: 'wrongpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('rate limiting', () => {
    test('returns 429 after too many failed attempts', async () => {
      // Exhaust the 5-attempt window from a single IP
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          email: 'wrong@email.com',
          password: 'wrongpassword',
        });
        await POST(request);
      }

      const request = createMockRequest({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many login attempts');
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

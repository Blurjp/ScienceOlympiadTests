/**
 * Tests for app/api/admin/tests/route.ts (indexable toggle)
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/tests/route';
import { ADMIN_COOKIE_NAME, SESSION_DURATION, createAdminSessionCookieValue } from '@/lib/admin-auth';

jest.mock('@/lib/database', () => ({
  getPageEligibleTestSummaries: jest.fn(),
  setTestIndexable: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

import { getPageEligibleTestSummaries, setTestIndexable } from '@/lib/database';

const mockGetSummaries = getPageEligibleTestSummaries as jest.MockedFunction<
  typeof getPageEligibleTestSummaries
>;
const mockSetIndexable = setTestIndexable as jest.MockedFunction<typeof setTestIndexable>;

function createAuthenticatedRequest(url: string, body?: unknown): NextRequest {
  const validCookie = createAdminSessionCookieValue({
    email: process.env.ADMIN_EMAIL!,
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  });
  const request = new NextRequest(
    url,
    body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) }
  );
  request.cookies.set(ADMIN_COOKIE_NAME, validCookie);
  return request;
}

describe('/api/admin/tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    test('rejects unauthenticated callers', async () => {
      const response = await GET(new NextRequest('http://localhost:3000/api/admin/tests'));
      expect(response.status).toBe(401);
      expect(mockGetSummaries).not.toHaveBeenCalled();
    });

    test('lists page-eligible tests for the admin', async () => {
      const tests = [{ id: 't1', topic: 'Astronomy', difficulty: 'Medium', questionCount: 18, indexable: true }];
      mockGetSummaries.mockResolvedValue(tests as any);

      const response = await GET(
        createAuthenticatedRequest('http://localhost:3000/api/admin/tests')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tests).toEqual(tests);
    });
  });

  describe('POST', () => {
    test('rejects unauthenticated callers', async () => {
      const response = await POST(
        new NextRequest('http://localhost:3000/api/admin/tests', {
          method: 'POST',
          body: JSON.stringify({ id: 't1', indexable: true }),
        })
      );
      expect(response.status).toBe(401);
      expect(mockSetIndexable).not.toHaveBeenCalled();
    });

    test('validates the body shape', async () => {
      const response = await POST(
        createAuthenticatedRequest('http://localhost:3000/api/admin/tests', {
          id: 123,
          indexable: 'yes',
        })
      );
      expect(response.status).toBe(400);
      expect(mockSetIndexable).not.toHaveBeenCalled();
    });

    test('toggles indexing for a valid request', async () => {
      mockSetIndexable.mockResolvedValue({ ok: true });

      const response = await POST(
        createAuthenticatedRequest('http://localhost:3000/api/admin/tests', {
          id: 't1',
          indexable: true,
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, id: 't1', indexable: true });
      expect(mockSetIndexable).toHaveBeenCalledWith('t1', true);
    });

    test('surfaces the guardrail refusal as 409 with the reason', async () => {
      mockSetIndexable.mockResolvedValue({ ok: false, reason: 'Below the 10-question quality bar' });

      const response = await POST(
        createAuthenticatedRequest('http://localhost:3000/api/admin/tests', {
          id: 't1',
          indexable: true,
        })
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Below the 10-question quality bar');
    });
  });
});

/**
 * Tests for app/api/admin/stats/route.ts
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/stats/route';
import { ADMIN_COOKIE_NAME, SESSION_DURATION } from '@/lib/admin-auth';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getAdminStats: jest.fn(),
  getApiUsageByDay: jest.fn(),
  getTopicUsageStats: jest.fn(),
  getRecentUsers: jest.fn(),
  getRecentApiCalls: jest.fn(),
}));

import {
  getAdminStats,
  getApiUsageByDay,
  getTopicUsageStats,
  getRecentUsers,
  getRecentApiCalls,
} from '@/lib/database';

const mockGetAdminStats = getAdminStats as jest.MockedFunction<typeof getAdminStats>;
const mockGetApiUsageByDay = getApiUsageByDay as jest.MockedFunction<typeof getApiUsageByDay>;
const mockGetTopicUsageStats = getTopicUsageStats as jest.MockedFunction<typeof getTopicUsageStats>;
const mockGetRecentUsers = getRecentUsers as jest.MockedFunction<typeof getRecentUsers>;
const mockGetRecentApiCalls = getRecentApiCalls as jest.MockedFunction<typeof getRecentApiCalls>;

function createAuthenticatedRequest(url: string): NextRequest {
  const validSession = JSON.stringify({
    email: 'blurjp@gmail.com',
    token: 'test-token',
    expiresAt: Date.now() + SESSION_DURATION,
  });

  const request = new NextRequest(url);
  request.cookies.set(ADMIN_COOKIE_NAME, validSession);
  return request;
}

function createUnauthenticatedRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleStats = {
    totalUsers: 100,
    totalTests: 500,
    totalApiCalls: 10000,
  };

  const sampleUsageByDay = [
    { date: '2023-01-01', count: 10 },
    { date: '2023-01-02', count: 15 },
  ];

  const sampleTopicStats = [
    { topic: 'Anatomy', count: 100 },
    { topic: 'Astronomy', count: 80 },
  ];

  const sampleRecentUsers = [
    { id: 'user-1', email: 'user1@test.com' },
  ];

  const sampleRecentApiCalls = [
    { id: 'call-1', endpoint: '/api/test', timestamp: new Date().toISOString() },
  ];

  describe('authentication', () => {
    test('returns 401 when not authenticated', async () => {
      const request = createUnauthenticatedRequest('http://localhost:3000/api/admin/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 for expired session', async () => {
      const expiredSession = JSON.stringify({
        email: 'blurjp@gmail.com',
        token: 'test-token',
        expiresAt: Date.now() - 1000, // expired
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, expiredSession);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 for non-admin email', async () => {
      const nonAdminSession = JSON.stringify({
        email: 'notadmin@test.com',
        token: 'test-token',
        expiresAt: Date.now() + SESSION_DURATION,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, nonAdminSession);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 for invalid cookie JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, 'not valid json');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 for missing email in session', async () => {
      const invalidSession = JSON.stringify({
        token: 'test-token',
        expiresAt: Date.now() + SESSION_DURATION,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, invalidSession);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    test('returns 401 for missing expiresAt in session', async () => {
      const invalidSession = JSON.stringify({
        email: 'blurjp@gmail.com',
        token: 'test-token',
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, invalidSession);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
    });
  });

  describe('action=overview (default)', () => {
    test('returns overview stats', async () => {
      mockGetAdminStats.mockResolvedValue(sampleStats as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(sampleStats);
    });

    test('returns overview stats when action=overview explicitly', async () => {
      mockGetAdminStats.mockResolvedValue(sampleStats as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=overview');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(sampleStats);
    });
  });

  describe('action=usage-by-day', () => {
    test('returns usage by day with default 30 days', async () => {
      mockGetApiUsageByDay.mockResolvedValue(sampleUsageByDay as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=usage-by-day');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.usageByDay).toEqual(sampleUsageByDay);
      expect(mockGetApiUsageByDay).toHaveBeenCalledWith(30);
    });

    test('returns usage by day with custom days parameter', async () => {
      mockGetApiUsageByDay.mockResolvedValue(sampleUsageByDay as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=usage-by-day&days=7');
      const response = await GET(request);

      expect(mockGetApiUsageByDay).toHaveBeenCalledWith(7);
    });
  });

  describe('action=topic-stats', () => {
    test('returns topic stats', async () => {
      mockGetTopicUsageStats.mockResolvedValue(sampleTopicStats as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=topic-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.topicStats).toEqual(sampleTopicStats);
    });
  });

  describe('action=recent-users', () => {
    test('returns recent users with default limit', async () => {
      mockGetRecentUsers.mockResolvedValue(sampleRecentUsers as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=recent-users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recentUsers).toEqual(sampleRecentUsers);
      expect(mockGetRecentUsers).toHaveBeenCalledWith(20);
    });

    test('returns recent users with custom limit', async () => {
      mockGetRecentUsers.mockResolvedValue(sampleRecentUsers as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=recent-users&limit=50');
      const response = await GET(request);

      expect(mockGetRecentUsers).toHaveBeenCalledWith(50);
    });
  });

  describe('action=recent-api-calls', () => {
    test('returns recent API calls with default limit', async () => {
      mockGetRecentApiCalls.mockResolvedValue(sampleRecentApiCalls as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=recent-api-calls');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recentApiCalls).toEqual(sampleRecentApiCalls);
      expect(mockGetRecentApiCalls).toHaveBeenCalledWith(50);
    });

    test('returns recent API calls with custom limit', async () => {
      mockGetRecentApiCalls.mockResolvedValue(sampleRecentApiCalls as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=recent-api-calls&limit=100');
      const response = await GET(request);

      expect(mockGetRecentApiCalls).toHaveBeenCalledWith(100);
    });
  });

  describe('action=all', () => {
    test('returns all stats combined', async () => {
      mockGetAdminStats.mockResolvedValue(sampleStats as any);
      mockGetApiUsageByDay.mockResolvedValue(sampleUsageByDay as any);
      mockGetTopicUsageStats.mockResolvedValue(sampleTopicStats as any);
      mockGetRecentUsers.mockResolvedValue(sampleRecentUsers as any);
      mockGetRecentApiCalls.mockResolvedValue(sampleRecentApiCalls as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(sampleStats);
      expect(data.usageByDay).toEqual(sampleUsageByDay);
      expect(data.topicStats).toEqual(sampleTopicStats);
      expect(data.recentUsers).toEqual(sampleRecentUsers);
      expect(data.recentApiCalls).toEqual(sampleRecentApiCalls);
    });
  });

  describe('invalid action', () => {
    test('returns 400 for invalid action', async () => {
      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockGetAdminStats.mockRejectedValue(new Error('Database error'));

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch stats');
    });
  });
});

/**
 * Tests for app/api/admin/stats/route.ts
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/stats/route';
import { ADMIN_COOKIE_NAME, SESSION_DURATION, createAdminSessionCookieValue } from '@/lib/admin-auth';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getAdminStats: jest.fn(),
  getApiUsageByDay: jest.fn(),
  getTopicUsageStats: jest.fn(),
  getRecentUsers: jest.fn(),
  getRecentApiCalls: jest.fn(),
  getAllUsersWithActivity: jest.fn(),
}));

// Mock NextAuth so the route's session fallback can be tested in isolation
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

import {
  getAdminStats,
  getApiUsageByDay,
  getTopicUsageStats,
  getRecentUsers,
  getRecentApiCalls,
  getAllUsersWithActivity,
} from '@/lib/database';

const mockGetAdminStats = getAdminStats as jest.MockedFunction<typeof getAdminStats>;
const mockGetApiUsageByDay = getApiUsageByDay as jest.MockedFunction<typeof getApiUsageByDay>;
const mockGetTopicUsageStats = getTopicUsageStats as jest.MockedFunction<typeof getTopicUsageStats>;
const mockGetRecentUsers = getRecentUsers as jest.MockedFunction<typeof getRecentUsers>;
const mockGetRecentApiCalls = getRecentApiCalls as jest.MockedFunction<typeof getRecentApiCalls>;
const mockGetAllUsersWithActivity = getAllUsersWithActivity as jest.MockedFunction<typeof getAllUsersWithActivity>;

function createAuthenticatedRequest(url: string): NextRequest {
  const validCookie = createAdminSessionCookieValue({
    email: process.env.ADMIN_EMAIL!,
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  });

  const request = new NextRequest(url);
  request.cookies.set(ADMIN_COOKIE_NAME, validCookie);
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

  const sampleUsers = [
    {
      id: 'user-1',
      email: 'user1@test.com',
      name: 'User One',
      image: null,
      provider: 'google',
      createdAt: '2024-01-01 00:00:00',
      subscriptionStatus: 'free',
      subscriptionCurrentPeriodEnd: null,
      testsCompleted: 5,
      avgScore: 80,
      testsCreated: 1,
      aiGenerations: 2,
      apiCalls: 10,
      lastActive: '2024-01-15 00:00:00',
    },
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
      const expiredCookie = createAdminSessionCookieValue({
        email: process.env.ADMIN_EMAIL!,
        authenticated: true,
        expiresAt: Date.now() - 1000, // expired
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, expiredCookie);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 for non-admin email', async () => {
      const nonAdminCookie = createAdminSessionCookieValue({
        email: 'notadmin@test.com',
        authenticated: true,
        expiresAt: Date.now() + SESSION_DURATION,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(ADMIN_COOKIE_NAME, nonAdminCookie);

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
      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(
        ADMIN_COOKIE_NAME,
        createAdminSessionCookieValue({
          email: '',
          authenticated: true,
          expiresAt: Date.now() + SESSION_DURATION,
        })
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    test('returns 401 for missing expiresAt in session', async () => {
      // Signed cookie missing expiresAt fails verification
      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      request.cookies.set(
        ADMIN_COOKIE_NAME,
        createAdminSessionCookieValue({
          email: process.env.ADMIN_EMAIL!,
          authenticated: true,
          expiresAt: 0,
        })
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    test('grants access via NextAuth session for admin email', async () => {
      const { auth } = jest.requireMock('@/auth') as { auth: jest.Mock };
      auth.mockResolvedValueOnce({ user: { email: process.env.ADMIN_EMAIL! } });
      mockGetAdminStats.mockResolvedValue(sampleStats as any);

      const request = createUnauthenticatedRequest('http://localhost:3000/api/admin/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    test('returns 401 via NextAuth session for non-admin email', async () => {
      const { auth } = jest.requireMock('@/auth') as { auth: jest.Mock };
      auth.mockResolvedValueOnce({ user: { email: 'regular.user@test.com' } });

      const request = createUnauthenticatedRequest('http://localhost:3000/api/admin/stats');
      const response = await GET(request);

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

  describe('action=users', () => {
    test('returns all users with activity', async () => {
      mockGetAllUsersWithActivity.mockResolvedValue(sampleUsers as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual(sampleUsers);
    });
  });

  describe('action=all', () => {
    test('returns all stats combined', async () => {
      mockGetAdminStats.mockResolvedValue(sampleStats as any);
      mockGetApiUsageByDay.mockResolvedValue(sampleUsageByDay as any);
      mockGetTopicUsageStats.mockResolvedValue(sampleTopicStats as any);
      mockGetAllUsersWithActivity.mockResolvedValue(sampleUsers as any);
      mockGetRecentApiCalls.mockResolvedValue(sampleRecentApiCalls as any);

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/stats?action=all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(sampleStats);
      expect(data.usageByDay).toEqual(sampleUsageByDay);
      expect(data.topicStats).toEqual(sampleTopicStats);
      expect(data.users).toEqual(sampleUsers);
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

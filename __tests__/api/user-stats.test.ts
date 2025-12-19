/**
 * Tests for app/api/user-stats/route.ts
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user-stats/route';

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database module
jest.mock('@/lib/database', () => ({
  getUserStats: jest.fn(),
}));

import { auth } from '@/auth';
import { getUserStats } from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetUserStats = getUserStats as jest.MockedFunction<typeof getUserStats>;

describe('GET /api/user-stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleStats = {
    totalTests: 10,
    averageScore: 85.5,
    totalTimeSpent: 18000,
    topicsCompleted: ['Anatomy', 'Astronomy'],
  };

  describe('authenticated user', () => {
    test('returns user stats', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserStats.mockResolvedValue(sampleStats as any);

      const request = new NextRequest('http://localhost:3000/api/user-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toEqual(sampleStats);
      expect(mockGetUserStats).toHaveBeenCalledWith('user-1');
    });
  });

  describe('unauthenticated user', () => {
    test('returns 401 when not logged in', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 when user has no ID', async () => {
      mockAuth.mockResolvedValue({ user: {} } as any);

      const request = new NextRequest('http://localhost:3000/api/user-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserStats.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/user-stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user stats');
    });
  });
});

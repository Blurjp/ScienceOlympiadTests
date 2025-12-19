/**
 * Tests for app/api/history/route.ts
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/history/route';

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database module
jest.mock('@/lib/database', () => ({
  getUserTestResults: jest.fn(),
  getTest: jest.fn(),
}));

import { auth } from '@/auth';
import { getUserTestResults, getTest } from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetUserTestResults = getUserTestResults as jest.MockedFunction<typeof getUserTestResults>;
const mockGetTest = getTest as jest.MockedFunction<typeof getTest>;

describe('GET /api/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleResults = [
    {
      id: 'result-1',
      testId: 'test-1',
      score: 85,
      totalPoints: 100,
      percentage: 85,
      correctAnswers: 17,
      totalQuestions: 20,
      timeSpent: 1800,
      completedAt: '2023-01-01T00:00:00Z',
    },
  ];

  const sampleTest = {
    id: 'test-1',
    title: 'Anatomy Test',
    topic: 'Anatomy and Physiology',
  };

  describe('authenticated user', () => {
    test('returns test history with test details', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserTestResults.mockResolvedValue(sampleResults as any);
      mockGetTest.mockResolvedValue(sampleTest as any);

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].testTitle).toBe('Anatomy Test');
      expect(data.results[0].testTopic).toBe('Anatomy and Physiology');
    });

    test('handles missing test gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserTestResults.mockResolvedValue(sampleResults as any);
      mockGetTest.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].testTitle).toBe('Unknown Test');
      expect(data.results[0].testTopic).toBe('Unknown');
    });

    test('returns empty array when no results', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserTestResults.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
    });
  });

  describe('unauthenticated user', () => {
    test('returns 401 when not logged in', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns 401 when user has no ID', async () => {
      mockAuth.mockResolvedValue({ user: {} } as any);

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockGetUserTestResults.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch history');
    });
  });
});

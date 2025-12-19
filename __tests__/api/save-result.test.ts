/**
 * Tests for app/api/save-result/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/save-result/route';

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database module
jest.mock('@/lib/database', () => ({
  saveTestResult: jest.fn(),
}));

import { auth } from '@/auth';
import { saveTestResult } from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSaveTestResult = saveTestResult as jest.MockedFunction<typeof saveTestResult>;

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/save-result', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('POST /api/save-result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = {
    testId: 'test-1',
    score: 85,
    totalPoints: 100,
    percentage: 85,
    correctAnswers: 17,
    totalQuestions: 20,
    timeSpent: 1800,
  };

  describe('successful save', () => {
    test('saves result for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const request = createMockRequest(validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('user-1');
      expect(mockSaveTestResult).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'test-1',
          userId: 'user-1',
          score: 85,
        })
      );
    });

    test('saves result for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const request = createMockRequest(validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBeNull();
      expect(mockSaveTestResult).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 'test-1',
          userId: undefined,
        })
      );
    });

    test('calculates percentage when not provided', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const bodyWithoutPercentage = {
        testId: 'test-1',
        score: 50,
        totalPoints: 100,
      };

      const request = createMockRequest(bodyWithoutPercentage);
      await POST(request);

      expect(mockSaveTestResult).toHaveBeenCalledWith(
        expect.objectContaining({
          percentage: 50,
        })
      );
    });

    test('uses default values for optional fields', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const minimalBody = {
        testId: 'test-1',
        score: 85,
        totalPoints: 100,
      };

      const request = createMockRequest(minimalBody);
      await POST(request);

      expect(mockSaveTestResult).toHaveBeenCalledWith(
        expect.objectContaining({
          correctAnswers: 0,
          totalQuestions: 0,
          timeSpent: 0,
        })
      );
    });
  });

  describe('validation errors', () => {
    test('returns 400 when testId is missing', async () => {
      const request = createMockRequest({
        score: 85,
        totalPoints: 100,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 when score is missing', async () => {
      const request = createMockRequest({
        testId: 'test-1',
        totalPoints: 100,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('returns 400 when totalPoints is missing', async () => {
      const request = createMockRequest({
        testId: 'test-1',
        score: 85,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    test('allows score of 0', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const request = createMockRequest({
        testId: 'test-1',
        score: 0,
        totalPoints: 100,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    test('allows totalPoints of 0', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockResolvedValue({ id: 'result-1' } as any);

      const request = createMockRequest({
        testId: 'test-1',
        score: 0,
        totalPoints: 0,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockAuth.mockResolvedValue(null);
      mockSaveTestResult.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(validBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save test result');
    });
  });
});

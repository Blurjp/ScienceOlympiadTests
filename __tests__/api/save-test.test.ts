/**
 * Tests for app/api/save-test/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/save-test/route';

// Mock the auth module (anonymous by default)
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

// Mock the database module
jest.mock('@/lib/database', () => ({
  saveTest: jest.fn(),
  getTestOwner: jest.fn(),
}));

import { saveTest, getTestOwner } from '@/lib/database';

const mockSaveTest = saveTest as jest.MockedFunction<typeof saveTest>;
const mockGetTestOwner = getTestOwner as jest.MockedFunction<typeof getTestOwner>;

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/save-test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('POST /api/save-test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // New test IDs by default (no existing owner)
    mockGetTestOwner.mockResolvedValue(null);
  });

  const validTest = {
    id: 'test-1',
    title: 'Anatomy Test',
    year: 2023,
    topic: 'Anatomy and Physiology',
    difficulty: 'Invitational',
    totalTime: 3600,
    totalPoints: 100,
    description: 'Test description',
    questions: [
      {
        id: 'q-1',
        question: 'What is the heart?',
        type: 'short-answer',
        correctAnswer: 'An organ',
        points: 10,
        category: 'General',
      },
    ],
  };

  describe('successful save', () => {
    test('saves valid test', async () => {
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ test: validTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.testId).toBe('test-1');
      // The API maps competition levels to database-compatible difficulty values
      // 'Invitational' -> 'Easy', 'Regional'/'State' -> 'Medium', 'National' -> 'Hard'
      expect(mockSaveTest).toHaveBeenCalledWith({
        ...validTest,
        difficulty: 'Easy', // Mapped from 'Invitational'
      }, undefined, undefined, undefined);
    });
  });

  describe('ownership protection', () => {
    test('returns 403 when overwriting a test owned by someone else', async () => {
      mockGetTestOwner.mockResolvedValue({ userId: 'someone-else' });

      const request = createMockRequest({ test: validTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have permission to modify this test');
      expect(mockSaveTest).not.toHaveBeenCalled();
    });

    test('allows overwriting an unowned (legacy) test', async () => {
      mockGetTestOwner.mockResolvedValue({ userId: null });
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ test: validTest });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSaveTest).toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    test('returns 400 when test is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No test data provided');
    });

    test('returns 400 when test.id is missing', async () => {
      const invalidTest = { ...validTest, id: undefined };
      const request = createMockRequest({ test: invalidTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid test data structure');
    });

    test('returns 400 when test.title is missing', async () => {
      const invalidTest = { ...validTest, title: undefined };
      const request = createMockRequest({ test: invalidTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid test data structure');
    });

    test('returns 400 when test.questions is missing', async () => {
      const invalidTest = { ...validTest, questions: undefined };
      const request = createMockRequest({ test: invalidTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid test data structure');
    });

    test('returns 400 when test.questions is not an array', async () => {
      const invalidTest = { ...validTest, questions: 'not an array' };
      const request = createMockRequest({ test: invalidTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid test data structure');
    });
  });

  describe('error handling', () => {
    test('returns 500 on database error', async () => {
      mockSaveTest.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({ test: validTest });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save test to database');
    });

    test('returns 500 on malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/save-test', {
        method: 'POST',
        body: 'not valid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });
});

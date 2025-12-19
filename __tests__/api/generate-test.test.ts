/**
 * Tests for app/api/generate-test/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-test/route';

// Mock the database module
jest.mock('@/lib/database', () => ({
  searchQuestions: jest.fn(),
  saveTest: jest.fn(),
}));

// Mock generateId to have predictable IDs
jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'mock-id-' + Math.random().toString(36).substr(2, 9)),
}));

import { searchQuestions, saveTest } from '@/lib/database';

const mockSearchQuestions = searchQuestions as jest.MockedFunction<typeof searchQuestions>;
const mockSaveTest = saveTest as jest.MockedFunction<typeof saveTest>;

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/generate-test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('POST /api/generate-test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleQuestions = [
    {
      id: 'q-1',
      type: 'multiple-choice',
      question: 'What is the heart?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      points: 5,
      category: 'Anatomy',
    },
    {
      id: 'q-2',
      type: 'short-answer',
      question: 'Describe photosynthesis',
      correctAnswer: 'Process',
      points: 10,
      category: 'Biology',
    },
    {
      id: 'q-3',
      type: 'multiple-choice',
      question: 'What is DNA?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      points: 5,
      category: 'Genetics',
    },
  ];

  describe('successful test generation', () => {
    test('generates test with default parameters', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.test).toBeDefined();
      expect(data.questionCount).toBe(3);
    });

    test('generates test with topic filter', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ topic: 'Anatomy and Physiology' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.test.topic).toBe('Anatomy and Physiology');
      expect(mockSearchQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 'Anatomy and Physiology' })
      );
    });

    test('generates test with difficulty filter', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ difficulty: 'State' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.test.difficulty).toBe('State');
    });

    test('generates test with year filter', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ year: 2023 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.basedOn.year).toBe(2023);
    });

    test('generates test with region filter', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ region: 'Regionals' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.basedOn.region).toBe('Regionals');
    });

    test('limits questions to questionCount parameter', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ questionCount: 2 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questionCount).toBe(2);
      expect(data.test.questions.length).toBe(2);
    });

    test('calculates total time based on timePerQuestion', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ questionCount: 2, timePerQuestion: 60 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalTime).toBe(120); // 2 questions * 60 seconds
    });

    test('filters by question types', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ includeTypes: ['multiple-choice'] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.test.questions.every((q: any) => q.type === 'multiple-choice')).toBe(true);
    });

    test('filters by categories', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ categories: ['Anatomy'] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.test.questions.every((q: any) => q.category === 'Anatomy')).toBe(true);
    });

    test('calculates total points correctly', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalPoints).toBe(20); // 5 + 10 + 5
    });

    test('saves test to database', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ topic: 'Anatomy' });
      await POST(request);

      expect(mockSaveTest).toHaveBeenCalledTimes(1);
      expect(mockSaveTest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Anatomy',
          questions: expect.any(Array),
        })
      );
    });
  });

  describe('error handling', () => {
    test('returns 404 when no questions found', async () => {
      mockSearchQuestions.mockResolvedValue([]);

      const request = createMockRequest({ topic: 'NonExistent' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No questions found');
    });

    test('returns 404 when filters eliminate all questions', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({ includeTypes: ['diagram'] }); // No diagram questions
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No questions found after applying filters');
    });

    test('returns 500 on database save error', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save generated test');
    });

    test('returns 500 on malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-test', {
        method: 'POST',
        body: 'not valid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate test');
    });
  });

  describe('test metadata', () => {
    test('generates descriptive title with all parameters', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({
        topic: 'Anatomy',
        year: 2023,
        region: 'Regionals',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.test.title).toContain('AI Generated');
      expect(data.test.title).toContain('Anatomy');
      expect(data.test.title).toContain('2023');
      expect(data.test.title).toContain('Regionals');
      expect(data.test.title).toContain('Practice Test');
    });

    test('uses current year when year not specified', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(data.test.year).toBe(new Date().getFullYear());
    });

    test('uses default difficulty when not specified', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(data.test.difficulty).toBe('Regional');
    });

    test('uses Mixed topic when not specified', async () => {
      mockSearchQuestions.mockResolvedValue(sampleQuestions as any);
      mockSaveTest.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(data.test.topic).toBe('Mixed');
    });
  });
});

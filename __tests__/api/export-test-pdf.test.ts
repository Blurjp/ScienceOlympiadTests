/**
 * Tests for /api/export-test-pdf — Pro-gated PDF export endpoint.
 * Covers auth, Pro gating, payload validation, and the happy path.
 */
import { NextRequest } from 'next/server';
import { clearRateLimits } from '@/lib/rate-limit';

jest.mock('@/lib/database', () => ({
  getSubscriptionStatus: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

import { POST as exportTestPdf } from '@/app/api/export-test-pdf/route';
import { auth } from '@/auth';
import { getSubscriptionStatus } from '@/lib/database';
import type { Test } from '@/lib/types';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSub = getSubscriptionStatus as jest.MockedFunction<typeof getSubscriptionStatus>;

const validTest: Test = {
  id: 't1',
  year: 2026,
  title: 'Astronomy Practice',
  description: 'desc',
  difficulty: 'Regional',
  totalTime: 600,
  totalPoints: 5,
  topic: 'Astronomy',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'Which planet is largest?',
      options: ['Earth', 'Jupiter'],
      correctAnswer: 'Jupiter',
      points: 1,
      category: 'Planets',
    },
  ],
};

function makeRequest(body: unknown, url = '/api/export-test-pdf'): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  clearRateLimits();
});

describe('export-test-pdf — auth and Pro gating', () => {
  test('rejects anonymous callers with 401', async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await exportTestPdf(makeRequest({ test: validTest }));

    expect(response.status).toBe(401);
  });

  test('rejects non-Pro users with 403 + upgradeRequired', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('free');

    const response = await exportTestPdf(makeRequest({ test: validTest }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.upgradeRequired).toBe(true);
    expect(data.error).toMatch(/Pro/i);
  });

  test('rejects past_due subscribers with 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('past_due');

    const response = await exportTestPdf(makeRequest({ test: validTest }));

    expect(response.status).toBe(403);
  });

  test('returns 500 when the subscription check throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockRejectedValue(new Error('db down'));

    const response = await exportTestPdf(makeRequest({ test: validTest }));

    expect(response.status).toBe(500);
  });
});

describe('export-test-pdf — payload validation', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('active');
  });

  test('rejects invalid JSON with 400', async () => {
    const response = await exportTestPdf(makeRequest('not json{'));
    expect(response.status).toBe(400);
  });

  test('rejects a missing test with 400', async () => {
    const response = await exportTestPdf(makeRequest({}));
    expect(response.status).toBe(400);
  });

  test('rejects a test without questions with 400', async () => {
    const response = await exportTestPdf(
      makeRequest({ test: { ...validTest, questions: [] } })
    );
    expect(response.status).toBe(400);
  });

  test('rejects questions with non-string options with 400', async () => {
    const badTest = {
      ...validTest,
      questions: [{ ...validTest.questions[0], options: ['A', 42] }],
    };
    const response = await exportTestPdf(makeRequest({ test: badTest }));
    expect(response.status).toBe(400);
  });

  test('rejects more than 200 questions with 400', async () => {
    const questions = Array.from({ length: 201 }, (_, i) => ({
      ...validTest.questions[0],
      id: `q${i}`,
    }));
    const response = await exportTestPdf(makeRequest({ test: { ...validTest, questions } }));
    expect(response.status).toBe(400);
  });
});

describe('export-test-pdf — happy path', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('active');
  });

  test('returns a PDF attachment for Pro users', async () => {
    const response = await exportTestPdf(makeRequest({ test: validTest }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="Astronomy_Practice.pdf"'
    );

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.slice(0, 5).toString('utf-8')).toBe('%PDF-');
  });

  test('forwards includeAnswerKey=false without error', async () => {
    const response = await exportTestPdf(
      makeRequest({ test: validTest, includeAnswerKey: false })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });
});

describe('export-test-pdf — rate limiting', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('active');
  });

  test('rate limits after 20 requests in the window', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 21; i++) {
      const response = await exportTestPdf(makeRequest({ test: validTest }));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});

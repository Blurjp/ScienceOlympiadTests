/**
 * Tests for the Pro-only question-count gate on /api/generate-ai-test:
 * free plan caps at 10 questions; Pro may request up to 40 (clamped).
 */
import { NextRequest } from 'next/server';
import { clearRateLimits } from '@/lib/rate-limit';

jest.mock('@/lib/database', () => ({
  saveTest: jest.fn(),
  logApiUsage: jest.fn(),
  getSubscriptionStatus: jest.fn(),
  getUserMonthlyAIGenerations: jest.fn().mockResolvedValue(0),
  getReferenceQuestions: jest.fn().mockResolvedValue([]),
  formatReferenceQuestionsForPrompt: jest.fn(() => ''),
  getCachedGeneration: jest.fn().mockResolvedValue(null),
  saveCachedGeneration: jest.fn(),
  getTopicMeta: jest.fn().mockResolvedValue({ hasData: false, subtopics: [], subtopicCount: 0 }),
  getAvailableExamSources: jest.fn().mockResolvedValue([]),
  getExamSourceById: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/openai', () => ({
  GENERATION_MODEL: 'test-model',
  GENERATION_REASONING_EFFORT: 'low',
  createStreamingChatCompletion: jest.fn().mockResolvedValue({
    text: JSON.stringify([
      {
        type: 'multiple-choice',
        question: 'Which planet has the most mass?',
        options: ['Earth', 'Jupiter', 'Mars', 'Venus'],
        correctAnswer: 'Jupiter',
        points: 1,
        category: 'Planets',
      },
    ]),
    finishReason: 'stop',
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  }),
  computeCostUsd: jest.fn(() => 0),
}));

jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'mock-id'),
}));

jest.mock('@/lib/seed-reference-questions', () => ({
  getSeedQuestionsForTopic: jest.fn(() => []),
}));

import { POST as generateAiTest } from '@/app/api/generate-ai-test/route';
import { auth } from '@/auth';
import { getSubscriptionStatus } from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSub = getSubscriptionStatus as jest.MockedFunction<typeof getSubscriptionStatus>;

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/generate-ai-test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  clearRateLimits();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
});

describe('generate-ai-test — Pro question-count gate', () => {
  test('free users requesting 30 questions get 403 + upgradeRequired', async () => {
    mockSub.mockResolvedValue('free');

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 30 })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.upgradeRequired).toBe(true);
    expect(data.message).toMatch(/10 questions/i);
  });

  test('free users can still generate 10 questions', async () => {
    mockSub.mockResolvedValue('free');

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 10 })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"total":10');
    expect(body).toContain('"type":"complete"');
  });

  test('Pro users can generate 30 questions', async () => {
    mockSub.mockResolvedValue('active');

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 30 })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"total":30');
    expect(body).toContain('"type":"complete"');
  });

  test('Pro requests above 40 clamp to 40', async () => {
    mockSub.mockResolvedValue('active');

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 50 })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"total":40');
  });

  test('a subscription-status failure falls back to the free cap (fail closed)', async () => {
    mockSub.mockRejectedValue(new Error('db down'));

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 30 })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.upgradeRequired).toBe(true);
  });
});

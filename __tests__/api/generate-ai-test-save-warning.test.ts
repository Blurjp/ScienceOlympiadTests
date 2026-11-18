/**
 * Tests for the save-warning hardening on /api/generate-ai-test:
 * a failed library save must be surfaced to the client (SSE `save-warning`
 * event) instead of being silently swallowed — the silent variant previously
 * caused "my tests disappeared" reports (16 lost generations pre-2026-10-25).
 */
import { NextRequest } from 'next/server';
import { clearRateLimits } from '@/lib/rate-limit';

jest.mock('@/lib/database', () => ({
  saveTest: jest.fn(),
  logApiUsage: jest.fn(),
  getSubscriptionStatus: jest.fn().mockResolvedValue('active'),
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
import { saveTest } from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSaveTest = saveTest as jest.MockedFunction<typeof saveTest>;

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

describe('generate-ai-test — save-failure visibility', () => {
  test('emits a save-warning SSE event when the library save fails', async () => {
    mockSaveTest.mockRejectedValue(new Error('db write failed'));

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 1 })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const body = await response.text();
    // The user still gets the generated test…
    expect(body).toContain('"type":"complete"');
    // …and is explicitly told it was not saved.
    expect(body).toContain('"type":"save-warning"');
    expect(body).toContain('My Tests');
  });

  test('emits no save-warning when the save succeeds', async () => {
    mockSaveTest.mockResolvedValue(undefined as never);

    const response = await generateAiTest(
      makeRequest({ topic: 'Astronomy', questionCount: 1 })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('"type":"complete"');
    expect(body).not.toContain('"type":"save-warning"');
  });
});

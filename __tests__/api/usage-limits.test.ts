/**
 * Tests for the Oct-2026 security/funnel hardening:
 * - /api/generate-ai-test now requires authentication (anonymous bypass closed)
 * - both AI generation endpoints enforce the FREE_TIER_MONTHLY_LIMIT
 */
import { NextRequest } from 'next/server';
import { clearRateLimits } from '@/lib/rate-limit';

jest.mock('@/lib/database', () => ({
  saveTest: jest.fn(),
  logApiUsage: jest.fn(),
  getSubscriptionStatus: jest.fn(),
  getUserMonthlyAIGenerations: jest.fn(),
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
  getOpenAI: jest.fn(),
  computeCostUsd: jest.fn(() => 0),
}));

jest.mock('@/lib/similarity-check', () => ({
  validateOriginalContent: jest.fn(),
  validateAndRepairQuestions: jest.fn((qs: unknown) => qs),
  normalizeQuestionType: jest.fn((t: string) => t),
}));

jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'mock-id'),
}));

jest.mock('@/lib/seed-reference-questions', () => ({
  getSeedQuestionsForTopic: jest.fn(() => []),
}));

import { POST as generateAiTest } from '@/app/api/generate-ai-test/route';
import { POST as generateFromPdf } from '@/app/api/generate-from-pdf/route';
import { auth } from '@/auth';
import {
  getSubscriptionStatus,
  getUserMonthlyAIGenerations,
  getExamSourceById,
} from '@/lib/database';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSub = getSubscriptionStatus as jest.MockedFunction<typeof getSubscriptionStatus>;
const mockUsage = getUserMonthlyAIGenerations as jest.MockedFunction<typeof getUserMonthlyAIGenerations>;
const mockSource = getExamSourceById as jest.MockedFunction<typeof getExamSourceById>;

function makeRequest(url: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('generate-ai-test — auth + metering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimits();
  });

  test('anonymous callers are rejected with 401', async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await generateAiTest(
      makeRequest('/api/generate-ai-test', { topic: 'Anatomy' })
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.signInRequired).toBe(true);
  });

  test('free user at the monthly limit is blocked with 403 limitReached', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('free');
    mockUsage.mockResolvedValue(5);

    const response = await generateAiTest(
      makeRequest('/api/generate-ai-test', { topic: 'Anatomy' })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.limitReached).toBe(true);
    expect(data.limit).toBe(5);
  });
});

describe('generate-from-pdf — auth + metering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimits();
  });

  test('anonymous callers are rejected with 401', async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await generateFromPdf(
      makeRequest('/api/generate-from-pdf', { sourceId: 'source-1' })
    );

    expect(response.status).toBe(401);
  });

  test('free user at the monthly limit is blocked before cache/generation (403)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockSub.mockResolvedValue('free');
    mockUsage.mockResolvedValue(5);
    mockSource.mockResolvedValue({ id: 'source-1', topic: 'Anatomy', level: 'State' } as never);

    const response = await generateFromPdf(
      makeRequest('/api/generate-from-pdf', { sourceId: 'source-1' })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.limitReached).toBe(true);
  });
});

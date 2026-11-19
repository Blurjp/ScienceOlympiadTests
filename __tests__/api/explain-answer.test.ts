/**
 * Tests for /api/explain-answer — Pro-gated AI answer explanations.
 */
import { NextRequest } from 'next/server';
import { clearRateLimits } from '@/lib/rate-limit';

jest.mock('@/lib/database', () => ({
  getSubscriptionStatus: jest.fn(),
  logApiUsage: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/openai', () => ({
  PARSING_MODEL: 'test-mini',
  createChatCompletion: jest.fn().mockResolvedValue({
    choices: [{ message: { content: '  Jupiter is the most massive planet because...  ' } }],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  }),
  computeCostUsd: jest.fn(() => 0.0001),
}));

import { POST as explainAnswer } from '@/app/api/explain-answer/route';
import { auth } from '@/auth';
import { getSubscriptionStatus, logApiUsage } from '@/lib/database';
import { createChatCompletion } from '@/lib/openai';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSub = getSubscriptionStatus as jest.MockedFunction<typeof getSubscriptionStatus>;
const mockCompletion = createChatCompletion as jest.MockedFunction<typeof createChatCompletion>;
const mockLog = logApiUsage as jest.MockedFunction<typeof logApiUsage>;

const VALID_BODY = {
  question: 'Which planet has the most mass?',
  options: ['Earth', 'Jupiter', 'Mars', 'Venus'],
  correctAnswer: 'Jupiter',
  userAnswer: 'Earth',
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/explain-answer', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  clearRateLimits();
  process.env.OPENAI_API_KEY = 'test-key';
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
});

describe('explain-answer — auth and Pro gating', () => {
  test('rejects anonymous callers with 401', async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await explainAnswer(makeRequest(VALID_BODY));

    expect(response.status).toBe(401);
  });

  test('rejects non-Pro users with 403 + upgradeRequired', async () => {
    mockSub.mockResolvedValue('free');

    const response = await explainAnswer(makeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.upgradeRequired).toBe(true);
  });

  test('rejects past_due subscribers with 403', async () => {
    mockSub.mockResolvedValue('past_due');

    const response = await explainAnswer(makeRequest(VALID_BODY));

    expect(response.status).toBe(403);
  });

  test('returns 500 when the subscription check throws', async () => {
    mockSub.mockRejectedValue(new Error('db down'));

    const response = await explainAnswer(makeRequest(VALID_BODY));

    expect(response.status).toBe(500);
  });
});

describe('explain-answer — payload validation', () => {
  beforeEach(() => {
    mockSub.mockResolvedValue('active');
  });

  test('rejects invalid JSON with 400', async () => {
    const response = await explainAnswer(makeRequest('not json{'));
    expect(response.status).toBe(400);
  });

  test('rejects a missing question with 400', async () => {
    const response = await explainAnswer(makeRequest({ correctAnswer: 'Jupiter' }));
    expect(response.status).toBe(400);
  });

  test('rejects a missing correctAnswer with 400', async () => {
    const response = await explainAnswer(makeRequest({ question: 'Which planet?' }));
    expect(response.status).toBe(400);
  });

  test('rejects non-string options safely (filtered, not fatal)', async () => {
    const response = await explainAnswer(
      makeRequest({ ...VALID_BODY, options: ['Earth', 42, null] })
    );

    expect(response.status).toBe(200);
    const sent = mockCompletion.mock.calls[0][0];
    expect(sent.messages[1].content).toContain('A) Earth');
    expect(sent.messages[1].content).not.toContain('42');
  });
});

describe('explain-answer — happy path', () => {
  beforeEach(() => {
    mockSub.mockResolvedValue('active');
  });

  test('returns the trimmed explanation for Pro users', async () => {
    const response = await explainAnswer(makeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.explanation).toBe('Jupiter is the most massive planet because...');
  });

  test('includes the student answer and options in the prompt', async () => {
    await explainAnswer(makeRequest(VALID_BODY));

    const prompt = mockCompletion.mock.calls[0][0].messages[1].content as string;
    expect(prompt).toContain('Which planet has the most mass?');
    expect(prompt).toContain('B) Jupiter');
    expect(prompt).toContain('The student answered: "Earth"');
    expect(prompt).toContain('Correct answer: "Jupiter"');
  });

  test('omits the student-answer line when unanswered', async () => {
    await explainAnswer(makeRequest({ ...VALID_BODY, userAnswer: undefined }));

    const prompt = mockCompletion.mock.calls[0][0].messages[1].content as string;
    expect(prompt).toContain('did not answer');
  });

  test('logs usage on success', async () => {
    await explainAnswer(makeRequest(VALID_BODY));

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'explain-answer', success: true })
    );
  });

  test('an empty AI response is a 500 and logs a failure', async () => {
    mockCompletion.mockResolvedValue({
      choices: [{ message: { content: '   ' } }],
      usage: undefined,
    } as never);

    const response = await explainAnswer(makeRequest(VALID_BODY));

    expect(response.status).toBe(500);
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});

describe('explain-answer — rate limiting', () => {
  beforeEach(() => {
    mockSub.mockResolvedValue('active');
  });

  test('rate limits after 30 requests in the window', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 31; i++) {
      const response = await explainAnswer(makeRequest(VALID_BODY));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});

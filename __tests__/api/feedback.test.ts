/**
 * Tests for app/api/feedback/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/feedback/route';

jest.mock('@/lib/database', () => ({
  saveFeedback: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

import { saveFeedback } from '@/lib/database';

const mockSaveFeedback = saveFeedback as jest.MockedFunction<typeof saveFeedback>;

let ipCounter = 0;

function postRequest(body: unknown): NextRequest {
  ipCounter += 1;
  return new NextRequest('https://example.com/api/feedback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `198.51.100.${ipCounter % 250}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a valid score and saves it', async () => {
    const res = await POST(postRequest({ score: 7, comment: 'More Astronomy tests!', context: 'win-back' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockSaveFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ score: 7, comment: 'More Astronomy tests!', context: 'win-back' })
    );
  });

  it('rejects missing or out-of-range scores', async () => {
    for (const score of [undefined, 0, 11, 3.5, 'seven']) {
      const res = await POST(postRequest({ score }));
      expect(res.status).toBe(400);
    }
    expect(mockSaveFeedback).not.toHaveBeenCalled();
  });

  it('silently accepts honeypot submissions without saving', async () => {
    const res = await POST(postRequest({ score: 5, company: 'spam-bot' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockSaveFeedback).not.toHaveBeenCalled();
  });

  it('rejects an invalid email but accepts none at all', async () => {
    const bad = await POST(postRequest({ score: 5, email: 'not-an-email' }));
    expect(bad.status).toBe(400);

    const none = await POST(postRequest({ score: 5 }));
    expect(none.status).toBe(200);
  });

  it('truncates overly long comments', async () => {
    const longComment = 'x'.repeat(5000);
    const res = await POST(postRequest({ score: 8, comment: longComment }));
    expect(res.status).toBe(200);
    expect(mockSaveFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'x'.repeat(2000) })
    );
  });
});

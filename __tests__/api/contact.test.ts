/**
 * Tests for app/api/contact/route.ts
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/contact/route';

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 3600_000 })),
  getClientIp: jest.fn(() => '127.0.0.1'),
  rateLimitResponse: jest.fn(() => new Response('Too many requests', { status: 429 })),
}));

const realFetch = global.fetch;

function makeRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: 'Test User',
  email: 'student@example.com',
  subject: 'Bug report',
  message: 'This is a sufficiently long test message.',
};

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_NOTIFICATION_EMAIL;
    delete process.env.CONTACT_FROM_EMAIL;
    global.fetch = realFetch;
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  test('rejects invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: 'not json',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('pretends success when honeypot is filled (bot trap)', async () => {
    const response = await POST(makeRequest({ ...validBody, company: 'spam-bot' }));
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
  });

  test('rejects invalid email', async () => {
    const response = await POST(makeRequest({ ...validBody, email: 'not-an-email' }));
    expect(response.status).toBe(400);
  });

  test('rejects too-short messages', async () => {
    const response = await POST(makeRequest({ ...validBody, message: 'hi' }));
    expect(response.status).toBe(400);
  });

  test('returns 503 with contact email when delivery is not configured', async () => {
    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.emailNotConfigured).toBe(true);
    expect(data.contactEmail).toBe('support@aitrove.ai');
  });

  test('sends email via Resend when configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.CONTACT_NOTIFICATION_EMAIL = 'owner@example.com';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '{}',
    });
    global.fetch = fetchMock as any;

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init as any).headers.Authorization).toBe('Bearer re_test_key');
    const payload = JSON.parse((init as any).body);
    expect(payload.to).toEqual(['owner@example.com']);
    expect(payload.reply_to).toBe('student@example.com');
    expect(payload.subject).toContain('Bug report');
    expect(payload.text).toContain('This is a sufficiently long test message.');
  });

  test('returns 502 when Resend rejects the request', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'unverified sender',
    });
    global.fetch = fetchMock as any;

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.contactEmail).toBe('support@aitrove.ai');
  });
});

/**
 * Tests for app/api/admin/win-back/route.ts
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/win-back/route';
import { ADMIN_COOKIE_NAME, SESSION_DURATION, createAdminSessionCookieValue } from '@/lib/admin-auth';

jest.mock('@/lib/database', () => ({
  getWinBackCandidates: jest.fn(),
  getPublicTestsSince: jest.fn().mockResolvedValue([]),
  countWinBackSentSince: jest.fn().mockResolvedValue(0),
  recordWinBackEmail: jest.fn(),
  getRecentWinBackEmails: jest.fn().mockResolvedValue([]),
  getRecentFeedback: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/win-back', () => ({
  buildWinBackEmail: jest.fn(() => ({ subject: 's', html: 'h', text: 't' })),
  createUnsubscribeToken: jest.fn(() => 'user-1.sig'),
  selectNewTestsForUser: jest.fn(() => ({
    links: [{ id: 't1', title: 'Anatomy 2026 Practice', url: '/tests/anatomy/t1-medium-practice-test' }],
    totalCount: 2,
  })),
  sendEmailViaResend: jest.fn().mockResolvedValue({ ok: true }),
}));

import {
  getWinBackCandidates,
  recordWinBackEmail,
} from '@/lib/database';
import { sendEmailViaResend, buildWinBackEmail } from '@/lib/win-back';

const mockGetCandidates = getWinBackCandidates as jest.MockedFunction<typeof getWinBackCandidates>;
const mockRecord = recordWinBackEmail as jest.MockedFunction<typeof recordWinBackEmail>;
const mockSend = sendEmailViaResend as jest.MockedFunction<typeof sendEmailViaResend>;
const mockBuild = buildWinBackEmail as jest.MockedFunction<typeof buildWinBackEmail>;

const candidate = {
  id: 'user-1',
  email: 'inactive@example.com',
  name: 'Jane',
  lastActive: '2026-05-01 00:00:00',
};

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

function authedRequest(url: string, init?: NextRequestInit): NextRequest {
  const request = new NextRequest(url, init);
  const cookie = createAdminSessionCookieValue({
    email: process.env.ADMIN_EMAIL!,
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  });
  request.cookies.set(ADMIN_COOKIE_NAME, cookie);
  return request;
}

describe('/api/admin/win-back', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_key';
  });

  describe('GET (preview)', () => {
    it('returns 401 without admin auth', async () => {
      const res = await GET(new NextRequest('https://example.com/api/admin/win-back'));
      expect(res.status).toBe(401);
    });

    it('returns the audience for an admin', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await GET(authedRequest('https://example.com/api/admin/win-back'));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.audienceCount).toBe(1);
      expect(data.candidates[0].email).toBe('inactive@example.com');
      expect(data.candidates[0].newTestsCount).toBe(2);
      expect(data.dailyCap).toBe(90);
      expect(data.resendConfigured).toBe(true);
    });
  });

  describe('POST (send)', () => {
    it('renders a per-user email preview without sending', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ previewUserId: 'user-1', note: 'Season update!' }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.preview).toBe(true);
      expect(data.email).toBe('inactive@example.com');
      expect(data.subject).toBe('s');
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'Jane', note: 'Season update!' })
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('returns 404 when previewing a user outside the audience', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ previewUserId: 'ghost' }),
        })
      );
      expect(res.status).toBe(404);
    });

    it('defaults to dry run: previews without sending or recording', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ note: 'Season update!' }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.dryRun).toBe(true);
      expect(data.wouldSend).toBe(1);
      expect(mockSend).not.toHaveBeenCalled();
      expect(mockRecord).not.toHaveBeenCalled();
    });

    it('sends and records when dryRun is false', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false, note: 'Season update!' }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sent).toBe(1);
      expect(data.failed).toBe(0);
      expect(mockSend).toHaveBeenCalledWith('inactive@example.com', expect.anything());
      expect(mockBuild).toHaveBeenCalledWith(
        expect.objectContaining({ siteUrl: 'https://sciolyprep.com', note: 'Season update!' })
      );
      expect(mockRecord).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', status: 'sent' })
      );
    });

    it('refuses to really send without RESEND_API_KEY', async () => {
      delete process.env.RESEND_API_KEY;
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false }),
        })
      );
      expect(res.status).toBe(503);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('enforces the daily cap', async () => {
      const { countWinBackSentSince } = jest.requireMock('@/lib/database');
      countWinBackSentSince.mockResolvedValueOnce(90);
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false }),
        })
      );
      expect(res.status).toBe(429);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('sends only to the admin-selected users when userIds is provided', async () => {
      const second = { ...candidate, id: 'user-2', email: 'second@example.com', name: 'Bob' };
      mockGetCandidates.mockResolvedValue([candidate, second]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false, userIds: ['user-2'] }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sent).toBe(1);
      expect(data.skippedUnknown).toBe(0);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith('second@example.com', expect.anything());
      expect(mockRecord).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-2', email: 'second@example.com' })
      );
    });

    it('skips selected ids that left the audience and reports them', async () => {
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false, userIds: ['user-1', 'ghost'] }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sent).toBe(1);
      expect(data.skippedUnknown).toBe(1);
    });

    it('records send failures without aborting the batch', async () => {
      mockSend.mockResolvedValueOnce({ ok: false, error: 'Resend 429: rate limited' });
      mockGetCandidates.mockResolvedValue([candidate]);
      const res = await POST(
        authedRequest('https://example.com/api/admin/win-back', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ dryRun: false }),
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(1);
      expect(data.failures[0].email).toBe('inactive@example.com');
      expect(mockRecord).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });
  });
});

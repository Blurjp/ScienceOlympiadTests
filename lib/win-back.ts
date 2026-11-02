// Win-back emails: HMAC-signed unsubscribe tokens, email rendering, and
// Resend delivery.
//
// Reuses the contact form's Resend REST integration (no SDK dependency) and
// the public test-page URL builders, so every link in the email resolves to
// a real canonical page — never a 404.

import crypto from 'crypto';
import { buildTestPath, isPageEligibleTest } from '@/lib/test-pages';
import { slugifyTopic } from '@/lib/event-pages';

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ''
  );
}

// ============================================
// Unsubscribe tokens (stateless, HMAC-signed)
// ============================================

export function createUnsubscribeToken(userId: string): string {
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(`winback-unsub:${userId}`)
    .digest('base64url');
  return `${userId}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`winback-unsub:${userId}`)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

// ============================================
// Selecting "new since you left" tests
// ============================================

export interface NewTestRow {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  description?: string | null;
  isPublic?: boolean;
  createdAt: string;
}

export interface NewTestLink {
  id: string;
  title: string;
  url: string;
}

// DB timestamps are 'YYYY-MM-DD HH:MM:SS' in UTC.
function parseDbDate(value: string): number {
  return new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z').getTime();
}

// Public tests created after the user's last activity. Only page-eligible
// tests are linked (emails must never 404); newest first.
export function selectNewTestsForUser(
  tests: NewTestRow[],
  lastActive: string | null,
  max = 3
): { links: NewTestLink[]; totalCount: number } {
  const cutoff = lastActive ? parseDbDate(lastActive) : 0;
  const fresh = tests
    .filter((t) => parseDbDate(t.createdAt) > cutoff)
    .filter((t) =>
      isPageEligibleTest({ title: t.title, description: t.description, isPublic: t.isPublic })
    )
    .sort((a, b) => parseDbDate(b.createdAt) - parseDbDate(a.createdAt));
  return {
    links: fresh.slice(0, max).map((t) => ({
      id: t.id,
      title: t.title,
      url: buildTestPath(slugifyTopic(t.topic), t.id, t.difficulty),
    })),
    totalCount: fresh.length,
  };
}

// ============================================
// Email rendering
// ============================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface WinBackEmailInput {
  userName: string | null;
  newTests: NewTestLink[];
  newTestsCount: number;
  siteUrl: string;
  /** Optional handwritten season update from the admin dashboard. */
  note?: string | null;
  unsubscribeToken: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildWinBackEmail(input: WinBackEmailInput): RenderedEmail {
  const { siteUrl } = input;
  const firstName = (input.userName || '').trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : `Hi there,`;
  const count = input.newTestsCount;
  const subject =
    count > 0
      ? `${count} new Science Olympiad practice test${count === 1 ? '' : 's'} since your last visit`
      : 'New Science Olympiad practice tests since your last visit';
  const updatesLine =
    count > 0
      ? `Since you were last here, we've added ${count} new practice test${count === 1 ? '' : 's'}:`
      : `We've been busy adding new Science Olympiad practice tests and features.`;
  const unsubUrl = `${siteUrl}/api/win-back/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;

  const listHtml = input.newTests.length
    ? `<ul style="margin:0 0 20px;padding-left:20px;color:#1f2937;font-size:15px;line-height:1.9;">${input.newTests
        .map(
          (t) =>
            `<li><a href="${siteUrl}${t.url}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(t.title)}</a></li>`
        )
        .join('')}</ul>`
    : '';
  const listText = input.newTests.length
    ? input.newTests.map((t) => `- ${t.title} (${siteUrl}${t.url})`).join('\n')
    : '';

  const noteHtml =
    input.note && input.note.trim()
      ? `<p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.7;">${escapeHtml(input.note.trim())}</p>`
      : '';
  const noteText = input.note && input.note.trim() ? `${input.note.trim()}\n\n` : '';

  // 1-10 one-click score links. The feedback page pre-selects the score and
  // the user confirms with one tap — no login wall in the way.
  const scoreRow = Array.from({ length: 10 }, (_, i) => i + 1)
    .map(
      (n) =>
        `<a href="${siteUrl}/feedback?score=${n}" style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;margin:0 3px;border:1px solid #d1d5db;border-radius:8px;color:#374151;text-decoration:none;font-size:14px;">${n}</a>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 12px;font-size:16px;color:#111827;font-weight:600;">${escapeHtml(greeting)}</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;line-height:1.7;">We noticed it's been a while — the new Science Olympiad season is heating up, and there's fresh material waiting for you.</p>
                <p style="margin:0 0 12px;color:#1f2937;font-size:15px;line-height:1.7;">${escapeHtml(updatesLine)}</p>
                ${listHtml}
                ${noteHtml}
                <p style="margin:24px 0 8px;color:#111827;font-size:15px;font-weight:600;">Before you go — how are we doing?</p>
                <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">1 = needs work, 10 = love it. One tap:</p>
                <p style="margin:0 0 24px;">${scoreRow}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#2563eb;border-radius:8px;">
                      <a href="${siteUrl}/tests" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Browse practice tests</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                  You receive this because you have a Science Olympiad Tests account.
                  <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from these emails</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${greeting}

We noticed it's been a while — the new Science Olympiad season is heating up, and there's fresh material waiting for you.

${updatesLine}
${listText}

${noteText}How are we doing? Rate us 1-10 here: ${siteUrl}/feedback

Browse practice tests: ${siteUrl}/tests

---
You receive this because you have a Science Olympiad Tests account.
Unsubscribe: ${unsubUrl}`;

  return { subject, html, text };
}

// ============================================
// Delivery (same REST pattern as the contact form)
// ============================================

export async function sendEmailViaResend(
  to: string,
  email: RenderedEmail
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        reply_to: process.env.CONTACT_NOTIFICATION_EMAIL || undefined,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      return { ok: false, error: `Resend ${res.status}: ${errorBody.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

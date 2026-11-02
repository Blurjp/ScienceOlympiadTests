import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/win-back';
import { setEmailUnsubscribed } from '@/lib/database';

export const dynamic = 'force-dynamic';

// One-click unsubscribe from win-back emails. The HMAC token identifies the
// user without a login, so the link works straight from any mail client.
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return new NextResponse('Invalid or expired unsubscribe link.', {
      status: 400,
      headers: { 'content-type': 'text/plain' },
    });
  }

  try {
    await setEmailUnsubscribed(userId);
  } catch (error) {
    console.error('Win-back unsubscribe failed:', error);
    return new NextResponse('Something went wrong. Please try again later.', {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    });
  }

  const html = `<!DOCTYPE html>
<html>
  <head><title>Unsubscribed — Science Olympiad Tests</title></head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
      <tr><td align="center">
        <table role="presentation" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr><td style="text-align:center;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">You're unsubscribed</h1>
            <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
              You won't receive any more win-back emails from Science Olympiad Tests.
              Account-related emails (receipts, security) are unaffected.
            </p>
            <a href="/" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Back to practice tests</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
}

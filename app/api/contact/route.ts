import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getContactEmail(): string {
  return process.env.CONTACT_NOTIFICATION_EMAIL || 'support@aitrove.ai';
}

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  company?: string; // honeypot - bots fill this in
}

export async function POST(request: NextRequest) {
  // Contact endpoints are a classic spam target: rate limit per IP
  const rateLimit = checkRateLimit('contact', getClientIp(request), 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  let body: ContactRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Honeypot: real users never see this field. Pretend success to bots.
  if (body.company && body.company.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const name = (body.name || '').trim().slice(0, 100);
  const email = (body.email || '').trim().slice(0, 254);
  const subject = (body.subject || 'General question').trim().slice(0, 120);
  const message = (body.message || '').trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Please write a message (at least 10 characters).' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` },
      { status: 400 }
    );
  }

  // Email delivery requires a Resend API key. When it's not configured,
  // tell the client so the UI can fall back to the visitor's email client.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        error: 'Email delivery is not configured. Please email us directly.',
        emailNotConfigured: true,
        contactEmail: getContactEmail(),
      },
      { status: 503 }
    );
  }

  const emailLines = [
    `From: ${name || 'Anonymous user'} <${email}>`,
    `Subject: ${subject}`,
    '',
    message,
  ];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev',
        to: [getContactEmail()],
        reply_to: email,
        subject: `[Science Olympiad Tests Contact] ${subject}`,
        text: emailLines.join('\n'),
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.error('Resend contact email failed:', res.status, errorBody);
      return NextResponse.json(
        { error: 'Failed to send your message. Please email us directly.', contactEmail: getContactEmail() },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return NextResponse.json(
      { error: 'Failed to send your message. Please email us directly.', contactEmail: getContactEmail() },
      { status: 502 }
    );
  }
}

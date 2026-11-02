import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { saveFeedback } from '@/lib/database';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_COMMENT_LENGTH = 2000;

interface FeedbackRequestBody {
  score?: number;
  comment?: string;
  email?: string;
  context?: string;
  company?: string; // honeypot - bots fill this in
}

// Public: submit a 1-10 score with optional comment. The win-back email's
// one-click score links land here pre-filled (?score=N → form preselect).
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit('feedback', getClientIp(request), 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  let body: FeedbackRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Honeypot: real users never see this field. Pretend success to bots.
  if (body.company && body.company.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const score = Number(body.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return NextResponse.json({ error: 'Please provide a score between 1 and 10.' }, { status: 400 });
  }

  const comment = (body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH);
  const email = (body.email || '').trim().slice(0, 254);
  if (email && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const context = body.context === 'general' ? 'general' : 'win-back';

  try {
    // Attribute to the signed-in account when available (win-back score
    // links open in the user's mail client, which often shares the browser
    // session); otherwise fall back to the optional email they typed.
    let userId: string | undefined;
    let attributedEmail = email || undefined;
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
      if (session?.user?.email) attributedEmail = session.user.email;
    } catch {
      // NextAuth unavailable — anonymous feedback is still valuable
    }

    await saveFeedback({
      userId,
      email: attributedEmail,
      score,
      comment: comment || undefined,
      context,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback save failed:', error);
    return NextResponse.json({ error: 'Failed to save feedback. Please try again.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSubscriptionStatus, logApiUsage } from '@/lib/database';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { PARSING_MODEL, createChatCompletion, computeCostUsd } from '@/lib/openai';

export const dynamic = 'force-dynamic';

/**
 * POST /api/explain-answer — Pro-only AI explanation of a test answer.
 *
 * Body: { question, options?, correctAnswer, userAnswer? }
 *
 * The question content is supplied by the client (the results screen already
 * has the full test), so the payload is validated and length-capped rather
 * than re-fetched. Pro status is verified server-side on every request —
 * free users can see the button in the UI but always get the upgrade prompt.
 */

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

/** Sanity caps for client-supplied content. */
const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 1000;
const MAX_OPTIONS = 10;
const MAX_OPTION_LENGTH = 500;

interface ExplainRequest {
  question?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  userAnswer?: unknown;
}

function clampString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, max);
}

function extractOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((option): option is string => typeof option === 'string')
    .slice(0, MAX_OPTIONS)
    .map((option) => option.trim().slice(0, MAX_OPTION_LENGTH))
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  // Cost-abuse protection: explanations are AI calls, so rate limit by IP.
  const rateLimit = checkRateLimit(
    'explain-answer',
    getClientIp(request),
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  // Require authentication.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'You must be signed in to use AI explanations' },
      { status: 401 }
    );
  }

  // Pro-only feature: verify the subscription server-side.
  try {
    const subscriptionStatus = await getSubscriptionStatus(userId);
    if (subscriptionStatus !== 'active') {
      return NextResponse.json(
        {
          error: 'AI explanations are a Pro feature',
          upgradeRequired: true,
          message: 'Upgrade to Pro to get an AI coach explanation for every answer.',
        },
        { status: 403 }
      );
    }
  } catch (statusError) {
    console.error('Subscription status check error:', statusError);
    return NextResponse.json(
      { error: 'Unable to verify subscription. Please try again.' },
      { status: 500 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI is not configured. Please try again later.' },
      { status: 500 }
    );
  }

  // Parse and validate the payload.
  let body: ExplainRequest | null = null;
  try {
    body = (await request.json()) as ExplainRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const question = clampString(body.question, MAX_QUESTION_LENGTH);
  const correctAnswer = clampString(body.correctAnswer, MAX_ANSWER_LENGTH);
  const userAnswer =
    body.userAnswer === undefined || body.userAnswer === null
      ? undefined
      : clampString(body.userAnswer, MAX_ANSWER_LENGTH);
  const options = extractOptions(body.options);

  if (!question || !correctAnswer) {
    return NextResponse.json(
      { error: 'A question and correct answer are required' },
      { status: 400 }
    );
  }

  // Build a compact coaching prompt.
  const optionLines =
    options && options.length > 0
      ? `\nOptions:\n${options.map((option, i) => `${'ABCDEFGHIJ'[i]}) ${option}`).join('\n')}`
      : '';
  const studentLine = userAnswer
    ? `\nThe student answered: "${userAnswer}"`
    : '\nThe student did not answer this question.';

  try {
    const completion = await createChatCompletion({
      model: PARSING_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly Science Olympiad coach explaining test answers to a high-school student. Be concise (3-5 sentences), factual, and encouraging. Explain WHY the correct answer is right; when the student answered incorrectly, also address the misconception behind their answer. Plain text only — no markdown, no headings, no bullet lists.',
        },
        {
          role: 'user',
          content: `Question: ${question}${optionLines}\nCorrect answer: "${correctAnswer}"${studentLine}\n\nExplain this answer to the student.`,
        },
      ],
      maxCompletionTokens: 1000,
    });

    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;

    const explanation = completion.choices[0]?.message?.content?.trim();
    if (!explanation) {
      throw new Error('Empty explanation response');
    }

    try {
      await logApiUsage({
        userId,
        endpoint: 'explain-answer',
        model: PARSING_MODEL,
        promptTokens,
        completionTokens,
        totalTokens: usage?.total_tokens || promptTokens + completionTokens,
        costUsd: computeCostUsd(usage, { model: PARSING_MODEL }),
        success: true,
      });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error('AI explanation error:', error);
    try {
      await logApiUsage({
        userId,
        endpoint: 'explain-answer',
        model: PARSING_MODEL,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        success: false,
        errorMessage: (error?.message || 'Unknown error').substring(0, 500),
      });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }
    return NextResponse.json(
      { error: 'Failed to generate the explanation. Please try again.' },
      { status: 500 }
    );
  }
}

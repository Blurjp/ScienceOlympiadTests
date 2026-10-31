import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { saveTest, logApiUsage, getSubscriptionStatus, getUserMonthlyAIGenerations, getReferenceQuestions, formatReferenceQuestionsForPrompt } from '@/lib/database';
import { GENERATION_MODEL, GENERATION_REASONING_EFFORT, createStreamingChatCompletion, computeCostUsd } from '@/lib/openai';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';
import { getSeedQuestionsForTopic } from '@/lib/seed-reference-questions';
import { TOPIC_DESCRIPTIONS, DIFFICULTY_DESCRIPTIONS } from '@/lib/topic-descriptions';

export const dynamic = 'force-dynamic';

// Increase function timeout for serverless
export const maxDuration = 60; // 60 seconds max

interface GenerateRequest {
  topic: string;
  questionCount?: number;
  difficulty?: 'Invitational' | 'Regional' | 'State' | 'National';
}

// Netlify has 26s timeout (Pro) or 10s (Free)
// OpenAI needs ~2-3 seconds per question, so limit to 10 questions max for reliability
const MAX_QUESTIONS_FOR_TIMEOUT = 10;

/** Count complete question objects in the partial JSON stream. */
function countGeneratedQuestions(text: string): number {
  return (text.match(/"question"\s*:/g) || []).length;
}

/**
 * Free-tier usage limit check. Returns a 403 response when the user is out
 * of monthly generations, or null when generation may proceed.
 */
async function checkUsageLimit(userId: string | undefined): Promise<NextResponse | null> {
  if (!userId) return null;
  try {
    const subscriptionStatus = await getSubscriptionStatus(userId);

    // Free users have a monthly limit
    if (subscriptionStatus !== 'active') {
      const monthlyUsage = await getUserMonthlyAIGenerations(userId);

      if (monthlyUsage >= FREE_TIER_MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: 'Monthly limit reached',
            limitReached: true,
            used: monthlyUsage,
            limit: FREE_TIER_MONTHLY_LIMIT,
            message: `You've used all ${FREE_TIER_MONTHLY_LIMIT} free AI test generations this month. Upgrade to Pro for unlimited access.`,
          },
          { status: 403 }
        );
      }
    }
  } catch (limitError) {
    console.error('Usage limit check error (non-fatal):', limitError);
    // Continue anyway - don't block on limit check failure
  }
  return null;
}

/** Fetch few-shot reference questions for the prompt (non-fatal). */
async function fetchReferenceExamples(topic: string, difficulty: string): Promise<string> {
  try {
    // First try database (for scraped/imported questions)
    const dbQuestions = await getReferenceQuestions({
      topic,
      difficulty,
      division: 'C', // Science Olympiad Division C only
      limit: 3,
      minQuality: 7,
      requireAnswer: true, // Filter out placeholder answers for few-shot examples
    });

    if (dbQuestions.length > 0) {
      return formatReferenceQuestionsForPrompt(dbQuestions);
    }

    // Fall back to seed questions
    const seedQuestions = getSeedQuestionsForTopic(topic);
    const filtered = seedQuestions
      .filter(q => q.difficulty === difficulty || seedQuestions.length < 5)
      .slice(0, 3);
    if (filtered.length > 0) {
      return formatReferenceQuestionsForPrompt(filtered);
    }
  } catch (refError) {
    console.error('Error fetching reference questions (non-fatal):', refError);
    // Continue without reference examples
  }
  return '';
}

export async function POST(request: NextRequest) {
  // Cost-abuse protection: rate limit applies to everyone as defense-in-depth
  // on top of the per-user free tier check below
  const rateIdentity = getClientIp(request);
  const rateLimit = checkRateLimit('generate-ai-test', rateIdentity, 10, 60 * 1000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  // Require authentication for AI generation (mirrors generate-from-pdf).
  // Anonymous callers previously bypassed the per-user free tier entirely,
  // which leaked unlimited OpenAI usage and undercut the free-to-paid funnel.
  const session = await auth();
  const userId = session?.user?.id;

  // Bypass for local development and admin tooling (same pattern as generate-from-pdf)
  const adminKey = request.headers.get('x-admin-key');
  const isAdminBypass = adminKey && adminKey === process.env.ADMIN_SECRET_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  if (!session && !isDev && !isAdminBypass) {
    return NextResponse.json(
      { error: 'Please sign in to generate AI tests.', signInRequired: true },
      { status: 401 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY environment variable');
    return NextResponse.json(
      { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
      { status: 500 }
    );
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch (parseError) {
    console.error('Request body parse error:', parseError);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
  const {
    topic,
    questionCount: requestedCount = 10,
    difficulty = 'Regional',
  } = body;

  // Limit question count to avoid timeout (Netlify has 26s limit)
  const questionCount = Math.min(requestedCount, MAX_QUESTIONS_FOR_TIMEOUT);

  if (!topic) {
    return NextResponse.json(
      { error: 'Topic is required' },
      { status: 400 }
    );
  }

  // Run the usage-limit check and the reference-question fetch in parallel:
  // both are independent DB round-trips that previously ran serially.
  const [limitResponse, referenceExamples] = await Promise.all([
    checkUsageLimit(userId),
    fetchReferenceExamples(topic, difficulty),
  ]);
  if (limitResponse) return limitResponse;

  const topicDescription = TOPIC_DESCRIPTIONS[topic] || topic.toLowerCase();
  const difficultyDescription = DIFFICULTY_DESCRIPTIONS[difficulty] || difficulty;

  // Enhanced prompt for higher quality questions. Built per chunk: the test
  // is generated by several concurrent "writers", each with a distinct
  // assigned angle so parallel chunks do not converge on the same questions.
  const buildUserPrompt = (count: number, angleHint: string, avoidStems: string[]): string => `You are an expert Science Olympiad coach creating part of a Division C practice test for ${topic}.

TOPIC: ${topic}
FOCUS AREAS: ${topicDescription}
DIFFICULTY LEVEL: ${difficulty}
LEVEL DESCRIPTION: ${difficultyDescription}

THIS SECTION: You are writing ${count} of the ${questionCount} questions in this test. Your assigned emphasis: ${angleHint}. Other sections of this test are being written in parallel with different assigned angles - stay within your emphasis and do not duplicate their territory.
${avoidStems.length ? `
The test already contains these questions - write different ones:
${avoidStems.map((s) => `- ${s}`).join('\n')}
` : ''}

Generate exactly ${count} high-quality questions following these strict guidelines:

QUESTION QUALITY REQUIREMENTS:
1. Questions must be factually accurate and scientifically precise
2. Use proper scientific terminology and units
3. Questions should test understanding, not just memorization
4. Include a mix of:
   - Recall questions (definitions, identification)
   - Application questions (using concepts in scenarios)
   - Analysis questions (interpreting data, comparing)
5. For ${difficulty} level, ensure appropriate complexity

QUESTION TYPE: ALL MULTIPLE CHOICE
- Every question MUST be multiple-choice with exactly 4 options (A, B, C, D)
- All 4 options should be plausible (no obviously wrong answers)
- Distractors should represent common misconceptions
- Avoid "all of the above" or "none of the above"
- Options should be similar in length and style
- correctAnswer MUST exactly match one of the options
${referenceExamples ? `
${referenceExamples}

Use these historical examples as a guide for question style, difficulty, and format. Your questions should be original but follow similar quality standards.
` : ''}
Return valid JSON:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Clear, specific question with context if needed?",
      "options": ["A) Plausible option 1", "B) Plausible option 2", "C) Plausible option 3", "D) Plausible option 4"],
      "correctAnswer": "B) Plausible option 2",
      "points": 1,
      "category": "${topic}"
    }
  ]
}

Generate exactly ${count} multiple-choice questions.`;

  const ANGLE_HINTS = [
    'foundational concepts, terminology, classifications, and structure/function identification',
    'applied scenarios, data interpretation, experimental design, and real-world applications',
    'quantitative and multi-step calculation questions, plus process/sequence reasoning',
  ];

  const SYSTEM_PROMPT = `You are an expert Science Olympiad coach and test writer with 20+ years of experience. You have deep expertise in ${topic} and understand exactly what makes a good competition question.

CRITICAL REQUIREMENTS:
1. Every question MUST be factually correct - verify your knowledge before generating
2. ALL questions MUST be multiple-choice with exactly 4 options (A, B, C, D)
3. The correctAnswer MUST exactly match one of the options
4. All options must be plausible - no obviously wrong answers
5. Questions should test real understanding, not trick students

FACTUAL ACCURACY (VERIFY BEFORE GENERATING):
- Use the KEY FACTS provided in the topic description - these are verified correct
- If stating a specific fact (date, name, number, sequence), double-check it's accurate
- For biological/anatomical questions: verify organ locations, system functions, correct terminology
- For classification questions: verify taxonomic relationships, category memberships
- For process questions: verify the correct sequence of steps
- If you're unsure about a specific fact, use a different question you're confident about

MATHEMATICAL ACCURACY (EXTREMELY IMPORTANT):
- For ANY calculation question, you MUST work through the math step-by-step BEFORE generating the question
- ALWAYS verify unit conversions (e.g., cm to mm, m to cm)
- Double-check that your calculated answer matches one of the multiple choice options
- Show your work mentally: write out the formula, substitute values, calculate step-by-step
- If unsure about a calculation, use simpler numbers that you can verify
- Common error to avoid: forgetting unit conversions (e.g., 4cm = 40mm, not 4mm)

Output valid JSON only.`;

  const buildMessages = (
    count: number,
    angleIndex: number,
    avoidStems: string[]
  ): ChatCompletionMessageParam[] => [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildUserPrompt(count, ANGLE_HINTS[angleIndex % ANGLE_HINTS.length], avoidStems),
    },
  ];

  // Stream the generation to the client via SSE so the user sees live
  // progress instead of a static spinner for the full 20-50s generation.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Log usage without crashing the stream (mirrors the old non-fatal pattern)
      const logUsage = async (success: boolean, questionCountLogged: number, errorMessage?: string) => {
        try {
          await logApiUsage({
            userId,
            endpoint: 'generate-ai-test',
            model: GENERATION_MODEL,
            promptTokens: usage?.prompt_tokens || 0,
            completionTokens: usage?.completion_tokens || 0,
            totalTokens: usage?.total_tokens || 0,
            costUsd: computeCostUsd(usage, { model: GENERATION_MODEL }),
            topic,
            difficulty,
            questionCount: questionCountLogged,
            success,
            errorMessage,
          });
        } catch (logError) {
          console.error('Failed to log API usage:', logError);
        }
      };

      let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

      try {
        send({ type: 'start', total: questionCount });

        // Parallel chunking: one long gpt-5.1 completion dominated the old
        // wall time (~30-45s for 10 questions). Splitting the test across
        // concurrent calls with distinct question angles cuts wall time to
        // roughly the slowest single chunk at the same model and reasoning
        // effort, so per-question quality is unchanged. Cost is nearly
        // unchanged too - completion tokens dominate and their total is the
        // same; only the shared prompt is re-sent per chunk.
        const CHUNK_SIZE = 4;
        const chunkSizes: number[] = [];
        for (let i = 0; i < questionCount; i += CHUNK_SIZE) {
          chunkSizes.push(Math.min(CHUNK_SIZE, questionCount - i));
        }

        const completedPerChunk = chunkSizes.map(() => 0);
        let lastSent = 0;
        const reportProgress = () => {
          const done = Math.min(
            questionCount,
            completedPerChunk.reduce((a, b) => a + b, 0)
          );
          if (done > lastSent) {
            lastSent = done;
            send({ type: 'progress', count: done, total: questionCount });
          }
        };

        const usageTotals = { prompt: 0, completion: 0 };
        let sawTruncation = false;

        /** One chunk: generate, stream per-chunk progress, parse. Retries once. */
        const runChunk = async (
          size: number,
          angleIndex: number,
          avoidStems: string[]
        ): Promise<any[]> => {
          const chunkMessages = buildMessages(size, angleIndex, avoidStems);
          for (let attempt = 0; attempt < 2; attempt++) {
            const { text: content, finishReason, usage: streamUsage } =
              await createStreamingChatCompletion({
                model: GENERATION_MODEL,
                messages: chunkMessages,
                // Cap includes reasoning tokens; sized for one chunk.
                maxCompletionTokens: 8000,
                reasoningEffort: GENERATION_REASONING_EFFORT,
                responseFormatJson: true,
                onDelta: (_delta, fullTextSoFar) => {
                  const c = countGeneratedQuestions(fullTextSoFar);
                  if (c > completedPerChunk[angleIndex]) {
                    completedPerChunk[angleIndex] = c;
                    reportProgress();
                  }
                },
              });
            if (streamUsage) {
              usageTotals.prompt += streamUsage.prompt_tokens || 0;
              usageTotals.completion += streamUsage.completion_tokens || 0;
            }
            if (finishReason === 'length') sawTruncation = true;

            try {
              const parsed = JSON.parse(content);
              const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
              if (Array.isArray(arr) && arr.length > 0) return arr;
              throw new Error('No questions in response');
            } catch (parseError: any) {
              if (attempt === 0) {
                console.error(
                  `Chunk ${angleIndex} failed (${parseError?.message}), retrying once`
                );
                continue;
              }
              throw new Error(
                `Section ${angleIndex + 1} failed to generate: ${parseError?.message || 'parse failed'}`
              );
            }
          }
          return [];
        };

        const chunkResults = await Promise.all(
          chunkSizes.map((size, i) => runChunk(size, i, []))
        );

        // Round-robin interleave so the merged test mixes angles instead of
        // grouping all foundational questions first.
        const merged: any[] = [];
        const longest = Math.max(...chunkResults.map((r) => r.length));
        for (let i = 0; i < longest; i++) {
          for (const result of chunkResults) {
            if (result[i]) merged.push(result[i]);
          }
        }

        // Near-duplicate sweep: parallel writers occasionally converge on the
        // same obvious question even with distinct angles.
        const isDuplicate = (a: string, b: string): boolean => {
          const tokens = (s: string) =>
            s
              .toLowerCase()
              .replace(/[^a-z0-9 ]/g, ' ')
              .split(/\s+/)
              .filter((w) => w.length > 3);
          const ta = new Set(tokens(a));
          const tb = tokens(b);
          if (!ta.size || !tb.length) return false;
          let shared = 0;
          for (const w of tb) if (ta.has(w)) shared++;
          return shared / tb.length >= 0.7;
        };
        const unique: any[] = [];
        for (const q of merged) {
          if (!unique.some((u) => isDuplicate(u.question, q.question))) {
            unique.push(q);
          }
        }

        // Rare top-up when duplicates were dropped, so users always get the
        // requested question count. Small serial call; skipped on failure.
        if (unique.length > 0 && unique.length < questionCount) {
          const missing = questionCount - unique.length;
          try {
            const topUp = await runChunk(
              missing,
              2,
              unique.map((q) => q.question)
            );
            for (const q of topUp) {
              if (unique.length < questionCount) unique.push(q);
            }
          } catch (topUpError) {
            console.error('Top-up chunk failed (non-fatal):', topUpError);
          }
        }

        usage = {
          prompt_tokens: usageTotals.prompt,
          completion_tokens: usageTotals.completion,
          total_tokens: usageTotals.prompt + usageTotals.completion,
        };

        if (unique.length === 0) {
          const errorMessage = sawTruncation
            ? 'Generation hit the output token limit while reasoning (finish_reason=length)'
            : 'Empty response from API';
          console.error(`Generation failed: ${errorMessage}`);
          await logUsage(false, questionCount, errorMessage.substring(0, 500));
          send({
            type: 'error',
            error: sawTruncation
              ? 'The AI ran out of output space while composing this test. Please try again, or generate fewer questions.'
              : 'Failed to generate questions - empty response',
          });
          return;
        }

        // Add IDs to questions
        const questions: Question[] = unique.slice(0, questionCount).map((q: any) => ({
          id: generateId(),
          type: q.type || 'short-answer',
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points || 1,
          category: q.category || topic,
        }));

        // Calculate totals
        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
        const totalTime = questions.length * 90; // 1.5 minutes per question

        // Create test
        const test: Test = {
          id: generateId(),
          year: new Date().getFullYear(),
          title: `AI Generated: ${topic} Practice Test`,
          description: `AI-generated practice test with ${questions.length} questions for ${topic}. Questions are AI-generated and should be verified for accuracy.`,
          difficulty,
          totalTime,
          totalPoints,
          topic,
          questions,
        };

        // Hand the finished test to the client immediately; persist after.
        send({
          type: 'complete',
          success: true,
          test,
          questionCount: questions.length,
          totalPoints,
          totalTime,
          aiGenerated: true,
          disclaimer: 'Questions are AI-generated. Verify answers before using for serious practice.',
        });

        // Save to database and log usage off the user's critical path. The
        // stream stays open while these run, keeping the function alive.
        // AI-generated tests are original content: publish to the library.
        try {
          await saveTest(test, undefined, undefined, userId, true);
        } catch (dbError) {
          console.error('Database save error (non-fatal):', dbError);
        }
        await logUsage(true, questions.length);

        send({ type: 'done' });
      } catch (error: any) {
        console.error('AI generation error:', error);

        // Handle specific OpenAI API errors
        let clientError = 'Failed to generate test';
        if (error?.status === 401 || error?.code === 'invalid_api_key') {
          clientError = 'Invalid OpenAI API key. Please check your API key configuration.';
        } else if (error?.status === 429) {
          clientError = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error?.code === 'insufficient_quota' || error?.status === 402) {
          clientError = 'OpenAI API quota exceeded. Please check your billing.';
        } else if (error?.code === 'model_not_found') {
          clientError = 'The AI model is not available. Please try again later.';
        } else if (error?.message) {
          clientError = `Failed to generate test: ${error.message}`;
        }

        await logUsage(false, questionCount, error?.message || 'Unknown error');
        send({ type: 'error', error: clientError });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

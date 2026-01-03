import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getSubscriptionStatus, getUserMonthlyAIGenerations, getReferenceQuestions, formatReferenceQuestionsForPrompt } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';
import { getSeedQuestionsForTopic } from '@/lib/seed-reference-questions';
import { TOPIC_DESCRIPTIONS, DIFFICULTY_DESCRIPTIONS } from '@/lib/topic-descriptions';

export const dynamic = 'force-dynamic';

// GPT-4o pricing (as of 2024) - using full model for better quality
const PRICE_PER_1K_PROMPT_TOKENS = 0.0025;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.01;

// Increase function timeout for serverless
export const maxDuration = 60; // 60 seconds max

// Lazy-load OpenAI client to avoid build errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface GenerateRequest {
  topic: string;
  questionCount?: number;
  difficulty?: 'Invitational' | 'Regional' | 'State' | 'National';
}

// Netlify has 26s timeout (Pro) or 10s (Free)
// OpenAI needs ~2-3 seconds per question, so limit to 10 questions max for reliability
const MAX_QUESTIONS_FOR_TIMEOUT = 10;

export async function POST(request: NextRequest) {
  // Get user session for tracking (don't let auth failure crash the request)
  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (authError) {
    console.error('Auth error (non-fatal):', authError);
  }

  // Check usage limits for free users
  if (userId) {
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
  }

  try {
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

    const topicDescription = TOPIC_DESCRIPTIONS[topic] || topic.toLowerCase();
    const difficultyDescription = DIFFICULTY_DESCRIPTIONS[difficulty] || difficulty;

    // Fetch reference questions for few-shot learning
    let referenceExamples = '';
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
        referenceExamples = formatReferenceQuestionsForPrompt(dbQuestions);
      } else {
        // Fall back to seed questions
        const seedQuestions = getSeedQuestionsForTopic(topic);
        const filtered = seedQuestions
          .filter(q => q.difficulty === difficulty || seedQuestions.length < 5)
          .slice(0, 3);
        if (filtered.length > 0) {
          referenceExamples = formatReferenceQuestionsForPrompt(filtered);
        }
      }
    } catch (refError) {
      console.error('Error fetching reference questions (non-fatal):', refError);
      // Continue without reference examples
    }

    // Enhanced prompt for higher quality questions
    const prompt = `You are an expert Science Olympiad coach creating a Division C practice test for ${topic}.

TOPIC: ${topic}
FOCUS AREAS: ${topicDescription}
DIFFICULTY LEVEL: ${difficulty}
LEVEL DESCRIPTION: ${difficultyDescription}

Generate exactly ${questionCount} high-quality questions following these strict guidelines:

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

Generate exactly ${questionCount} multiple-choice questions.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for higher quality questions
      messages: [
        {
          role: 'system',
          content: `You are an expert Science Olympiad coach and test writer with 20+ years of experience. You have deep expertise in ${topic} and understand exactly what makes a good competition question.

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

Output valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more accurate, consistent questions
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    // Extract token usage from completion
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;

    // Calculate cost
    const costUsd = (promptTokens / 1000 * PRICE_PER_1K_PROMPT_TOKENS) +
                    (completionTokens / 1000 * PRICE_PER_1K_COMPLETION_TOKENS);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI API');
      // Log failed API call (don't let this crash)
      try {
        await logApiUsage({
          userId,
          endpoint: 'generate-ai-test',
          model: 'gpt-4o',
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
          topic,
          difficulty,
          questionCount,
          success: false,
          errorMessage: 'Empty response from API',
        });
      } catch (logError) {
        console.error('Failed to log API usage:', logError);
      }

      return NextResponse.json(
        { error: 'Failed to generate questions - empty response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let questions: Question[];
    try {
      const parsed = JSON.parse(content);

      // Handle both array and object with questions key
      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        throw new Error('No questions in response');
      }

      // Add IDs to questions
      questions = questionArray.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        category: q.category || topic,
      }));
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError, 'Content:', content?.substring(0, 500));
      return NextResponse.json(
        {
          error: 'Failed to parse generated questions. Please try again.',
          details: parseError?.message || 'JSON parse failed',
          contentPreview: content?.substring(0, 200)
        },
        { status: 500 }
      );
    }

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

    // Save to database (don't let DB failure crash the response)
    try {
      await saveTest(test);
    } catch (dbError) {
      console.error('Database save error (non-fatal):', dbError);
      // Continue anyway - user still gets the test
    }

    // Log successful API usage (don't let logging failure crash the response)
    try {
      await logApiUsage({
        userId,
        endpoint: 'generate-ai-test',
        model: 'gpt-4o',
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        topic,
        difficulty,
        questionCount: questions.length,
        success: true,
      });
    } catch (logError) {
      console.error('API usage logging error (non-fatal):', logError);
    }

    return NextResponse.json({
      success: true,
      test,
      questionCount: questions.length,
      totalPoints,
      totalTime,
      aiGenerated: true,
      disclaimer: 'Questions are AI-generated. Verify answers before using for serious practice.',
    });
  } catch (error: any) {
    console.error('AI generation error:', error);

    // Handle specific OpenAI API errors
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error?.code === 'insufficient_quota' || error?.status === 402) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 402 }
      );
    }

    if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'The AI model is not available. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate test',
        details: error?.message || (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

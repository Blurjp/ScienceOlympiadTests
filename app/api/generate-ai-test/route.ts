import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getSubscriptionStatus, getUserMonthlyAIGenerations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';

// GPT-4o-mini pricing (as of 2024)
const PRICE_PER_1K_PROMPT_TOKENS = 0.00015;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.0006;

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

// Competition level difficulty descriptions
const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
  'Invitational': 'Invitational-style: simpler recall questions, wide variance in difficulty, good for beginners and early-season practice',
  'Regional': 'Regional-style: foundational but structured questions, testing core concepts with some application',
  'State': 'State-level: multi-step reasoning required, deeper understanding of concepts, more challenging applications',
  'National': 'National-level: extremely deep conceptual understanding, niche topics, complex multi-step problems, competition-ready difficulty',
};

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Anatomy and Physiology': 'human body systems, organs, tissues, and physiological processes',
  'Astronomy': 'stars, galaxies, planets, cosmology, and celestial mechanics',
  'Chemistry Lab': 'chemical reactions, lab techniques, stoichiometry, and chemical properties',
  'Disease Detectives': 'epidemiology, disease transmission, public health, and outbreak investigation',
  'Dynamic Planet': 'Earth science, geology, plate tectonics, and natural disasters',
  'Ecology': 'ecosystems, food webs, biodiversity, and environmental science',
  'Experimental Design': 'scientific method, experiment design, data analysis, and statistics',
  'Fermi Questions': 'estimation problems and order-of-magnitude calculations',
  'Forensics': 'crime scene analysis, evidence collection, and forensic science techniques',
  'Fossils': 'paleontology, fossil identification, geological time, and evolution',
  'Machines': 'simple machines, mechanical advantage, levers, pulleys, inclined planes, and physics of mechanical systems',
  'Microbe Mission': 'microbiology, bacteria, viruses, and microorganisms',
  'Optics': 'light, lenses, mirrors, reflection, refraction, and optical instruments',
  'Ornithology': 'bird identification, anatomy, behavior, and ecology',
  'Reach for the Stars': 'stellar astronomy, deep sky objects, and astrophysics',
  'Rocks and Minerals': 'rock types, mineral identification, and geological processes',
  'Tower': 'structural engineering principles and physics of structures',
  'Wind Power': 'renewable energy, wind turbine design, and energy physics',
  'Write It Do It': 'technical writing and following written instructions',
};

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

    // Optimized prompt - balanced for speed and clarity
    const prompt = `Generate ${questionCount} Science Olympiad Division C questions for ${topic} at ${difficulty} level.

Topic focus: ${topicDescription}
Difficulty: ${difficultyDescription}

Requirements:
- ~70% multiple choice (4 options A-D), ~30% short answer
- Factually accurate, competition-appropriate

Return valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Question text here?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A) First option",
      "points": 1,
      "category": "${topic}"
    },
    {
      "type": "short-answer",
      "question": "Question text here?",
      "correctAnswer": "Brief answer",
      "points": 2,
      "category": "${topic}"
    }
  ]
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Science Olympiad test generator. Output valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000, // Enough for 10 questions with proper JSON
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
          model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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

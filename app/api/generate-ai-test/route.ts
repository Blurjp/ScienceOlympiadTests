import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getSubscriptionStatus, getUserMonthlyAIGenerations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';

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

// Competition level difficulty descriptions with specific requirements
const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
  'Invitational': `Invitational-style (EASIEST):
- Simple recall and basic identification questions
- Direct questions with straightforward answers
- Focus on fundamental definitions and concepts
- Single-step problems only
- Example: "What is the name of the bone in the upper arm?"`,

  'Regional': `Regional-style (MODERATE):
- Mix of recall and application questions
- Some questions requiring 2-step reasoning
- Testing core concepts with basic applications
- Include some "why" and "how" questions
- Example: "If a first-class lever has an effort arm of 3m and a load arm of 1m, what is its mechanical advantage?"`,

  'State': `State-level (CHALLENGING):
- Multi-step reasoning required for most questions
- Application of concepts to novel scenarios
- Connections between multiple concepts
- Include data interpretation and analysis
- Obscure but testable details
- Example: "A patient presents with decreased deep tendon reflexes, muscle weakness, and fasciculations. Which motor neuron type is most likely affected, and what would you expect to see on EMG?"`,

  'National': `National-level (EXTREMELY DIFFICULT):
- Expect only top competitors to answer correctly
- Deep, nuanced understanding required
- Cutting-edge or highly specialized knowledge
- Complex multi-step calculations
- Integration of multiple advanced concepts
- Trick questions that test precise understanding
- Obscure exceptions and edge cases
- Example: "Calculate the Schwarzschild radius for a 3 solar mass black hole, then determine the tidal force experienced by a 2-meter tall astronaut at this radius. Would the astronaut survive? Justify with calculations."`,
};

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Anatomy and Physiology': 'human body systems (nervous, immune, cardiovascular, etc.), organ functions, tissue types, homeostasis, and physiological processes. Include questions about specific structures, functions, and disorders.',
  'Astronomy': `stellar evolution, HR diagrams, galaxy types, planetary science, celestial mechanics, cosmology, and observational techniques.

KEY FORMULAS:
- Distance modulus: m - M = 5 log(d/10), where d is in parsecs
- Parallax: d(pc) = 1/p(arcsec)
- Stefan-Boltzmann: L = 4πR²σT⁴
- Wien's Law: λmax = 2.898×10⁻³/T (meters)
- Kepler's 3rd Law: P² = a³ (P in years, a in AU for solar system)
- Escape velocity: v = √(2GM/r)`,
  'Chemistry Lab': `chemical reactions, stoichiometry, equilibrium, acid-base chemistry, redox reactions, lab safety, and analytical techniques.

KEY FORMULAS:
- Molarity: M = moles solute / liters solution
- Dilution: M₁V₁ = M₂V₂
- pH = -log[H⁺], pOH = -log[OH⁻], pH + pOH = 14
- Ideal Gas Law: PV = nRT (R = 0.0821 L·atm/mol·K)
- Kw = [H⁺][OH⁻] = 1×10⁻¹⁴ at 25°C
- % yield = (actual/theoretical) × 100%`,
  'Disease Detectives': 'epidemiology concepts (incidence, prevalence, mortality rates), disease transmission modes, outbreak investigation, study designs (cohort, case-control), and public health interventions.',
  'Dynamic Planet': 'plate tectonics, earthquakes, volcanoes, rock cycle, weathering, erosion, geological time scale, and Earth structure. Include specific examples and mechanisms.',
  'Ecology': 'population dynamics, community interactions, energy flow, nutrient cycles, biomes, succession, and conservation biology. Include specific species interactions and calculations.',
  'Experimental Design': 'variables (independent, dependent, controlled), hypothesis formation, experimental controls, data analysis, statistical concepts, and error analysis.',
  'Fermi Questions': 'order-of-magnitude estimation, dimensional analysis, and logical reasoning to estimate quantities.',
  'Forensics': 'evidence analysis (fingerprints, fibers, blood spatter), toxicology, DNA analysis, document examination, and crime scene procedures.',
  'Fossils': 'fossil types, preservation methods, index fossils, geological time periods, evolutionary relationships, and paleoenvironmental reconstruction.',
  'Machines': `simple machines (levers, pulleys, inclined planes, wheels, screws, wedges), mechanical advantage, efficiency, work, power, and compound machines.

KEY FORMULAS (YOU MUST USE THESE CORRECTLY):
- Lever IMA = effort arm length / load arm length
- Pulley IMA = number of supporting ropes
- Inclined Plane IMA = length / height
- Wheel & Axle IMA = wheel radius / axle radius
- Screw IMA = 2πr / pitch (where r = handle radius, pitch = thread spacing) - IMPORTANT: Convert units! If r=4cm and pitch=2mm, then IMA = 2π(40mm)/2mm = 125.66
- Wedge IMA = length / width
- Efficiency = (AMA / IMA) × 100% = (Work out / Work in) × 100%
- Work = Force × Distance
- Power = Work / Time`,
  'Microbe Mission': 'bacterial structure, viral replication, fungal characteristics, microbial ecology, disease mechanisms, and laboratory techniques (Gram staining, culturing).',
  'Optics': `reflection, refraction, Snell's law, lens and mirror equations, optical instruments (microscopes, telescopes), wave optics, and electromagnetic spectrum.

KEY FORMULAS:
- Snell's Law: n₁sinθ₁ = n₂sinθ₂
- Mirror/Lens equation: 1/f = 1/dₒ + 1/dᵢ
- Magnification: M = -dᵢ/dₒ = hᵢ/hₒ
- Critical angle: sinθc = n₂/n₁ (when n₁ > n₂)
- Telescope magnification: M = fₒ/fₑ (objective/eyepiece focal lengths)
- Wave equation: c = fλ, where c = 3×10⁸ m/s`,
  'Ornithology': 'bird identification (field marks, silhouettes), anatomy, flight mechanics, behavior, migration, ecology, and classification.',
  'Reach for the Stars': 'stellar classification, HR diagrams, stellar evolution, deep sky objects (nebulae, clusters, galaxies), and observational astronomy.',
  'Rocks and Minerals': 'mineral identification (hardness, luster, cleavage), rock classification, rock cycle, and geological processes.',
  'Tower': 'structural engineering, force analysis, material properties, load distribution, and structural failure modes.',
  'Wind Power': 'wind turbine design, energy conversion, Betz limit, power calculations, and renewable energy concepts.',
  'Write It Do It': 'technical writing clarity, precision, and following written instructions.',
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

QUESTION TYPES (aim for ~60% multiple choice, ~40% short answer):

MULTIPLE CHOICE:
- All 4 options should be plausible (no obviously wrong answers)
- Distractors should represent common misconceptions
- Avoid "all of the above" or "none of the above"
- Options should be similar in length and style

SHORT ANSWER:
- Answer should be 1-5 words (concise)
- Provide the most precise accepted answer
- For numerical answers, include units
- Accept common abbreviations in the answer

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
    },
    {
      "type": "short-answer",
      "question": "Specific question requiring brief answer?",
      "correctAnswer": "precise answer",
      "points": 2,
      "category": "${topic}"
    }
  ]
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for higher quality questions
      messages: [
        {
          role: 'system',
          content: `You are an expert Science Olympiad coach and test writer with 20+ years of experience. You have deep expertise in ${topic} and understand exactly what makes a good competition question.

CRITICAL REQUIREMENTS:
1. Every question MUST be factually correct - verify your knowledge before generating
2. For multiple choice, the correct answer MUST be among the options
3. All options must be plausible - no obviously wrong answers
4. Questions should test real understanding, not trick students

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

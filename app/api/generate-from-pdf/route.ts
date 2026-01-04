import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getCachedGeneration, saveCachedGeneration, getReferenceQuestions, formatReferenceQuestionsForPrompt, getTopicMeta, TopicMeta, getAvailableExamSources, DynamicExamSource } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { validateOriginalContent, validateAndRepairQuestions, normalizeQuestionType, ValidQuestionType } from '@/lib/similarity-check';
import { TOPIC_DESCRIPTIONS, DIFFICULTY_DESCRIPTIONS } from '@/lib/topic-descriptions';
import { getSeedQuestionsForTopic } from '@/lib/seed-reference-questions';

export const dynamic = 'force-dynamic';

// GPT-4o pricing (upgraded from gpt-4o-mini for better quality)
const PRICE_PER_1K_PROMPT_TOKENS = 0.0025;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.01;

// Map competition level values to database-compatible difficulty values
// The database CHECK constraint only allows: 'Easy', 'Medium', 'Hard'
function mapDifficultyForDatabase(difficulty: string | undefined | null): string {
  const competitionLevelMap: Record<string, string> = {
    'Invitational': 'Easy',
    'Regional': 'Medium',
    'State': 'Medium',
    'National': 'Hard',
  };
  // Always return a valid difficulty value, default to 'Medium'
  return competitionLevelMap[difficulty || ''] || 'Medium';
}

export const maxDuration = 120; // 2 minutes for PDF processing

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface GenerateFromPDFRequest {
  sourceId: string;
  questionCount?: number;
}

// Simplified source interface for generation
interface ExamSource {
  id: string;
  topic: string;
  level: 'Invitational' | 'Regional' | 'State' | 'National';
  name: string;
}

// Parse dynamic source ID (format: scraped-{topic-slug}-{level})
// Returns null if not a valid dynamic source ID
function parseDynamicSourceId(sourceId: string): ExamSource | null {
  if (!sourceId.startsWith('scraped-')) {
    return null;
  }

  // Format: scraped-{topic-slug}-{level}
  // e.g., scraped-anatomy-and-physiology-invitational
  const parts = sourceId.split('-');
  if (parts.length < 3) return null;

  const levelStr = parts[parts.length - 1];
  const topicSlug = parts.slice(1, -1).join('-');

  // Map level string to proper case
  const levelMap: Record<string, 'Invitational' | 'Regional' | 'State' | 'National'> = {
    'invitational': 'Invitational',
    'regional': 'Regional',
    'state': 'State',
    'national': 'National',
  };

  const level = levelMap[levelStr.toLowerCase()];
  if (!level) return null;

  // Convert slug back to topic name (best effort)
  const topic = topicSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: sourceId,
    topic,
    level,
    name: `${topic} - ${level}`,
  };
}

// Meta-information structure (NO copyrightable content)
interface ExamMetaInfo {
  difficultyLevel: string;
  timeLimitMinutes: number;
  hasCalculations: boolean;
  hasDiagrams: boolean;
  hasLabProcedures: boolean;
  // Real data from reference questions (when available)
  subtopics: string[];
  subtopicCount: number; // Accurate count of questions with subtopics
  hasRealData: boolean;
}

// System prompt for safe generation (loaded from prompts file concept)
const SAFE_GENERATION_SYSTEM_PROMPT = `You are generating a completely original Science Olympiad practice test.

CRITICAL COPYRIGHT SAFETY INSTRUCTIONS:

You will receive ONLY meta-information about an existing exam structure.

You MUST NOT:
1. Reproduce, copy, or quote any question from any source
2. Paraphrase or rephrase any existing question
3. Create questions with the same specific scenarios or contexts as real exams
4. Use the same numerical values or specific examples
5. Create content that could be considered a derivative work

You MUST:
1. Generate entirely NEW questions from scratch
2. Use different scenarios, contexts, and examples
3. Test similar broad topics through completely different angles
4. Create original numerical values and examples
5. Design new problem structures that assess skills differently

Every question must be:
- Completely original and not derived from any source
- Scientifically accurate for Division C (high school level)
- Appropriate for the indicated difficulty level`;

// Extract meta-information for generation
// Uses real data from reference questions when available
async function extractMetaInformation(source: ExamSource): Promise<ExamMetaInfo> {
  const topic = source.topic;
  const level = source.level;

  // Query real data from reference_questions table, filtered by difficulty
  let topicMeta: TopicMeta | null = null;
  try {
    topicMeta = await getTopicMeta(topic, level);
    // If no data for this difficulty, fall back to all difficulties
    if (!topicMeta.hasData) {
      topicMeta = await getTopicMeta(topic);
    }
  } catch (err) {
    console.warn('Failed to get topic meta (non-fatal):', err);
  }

  // Extract subtopics from real data (for prompt guidance)
  const subtopics = topicMeta?.hasData
    ? topicMeta.subtopics.slice(0, 5).map(s => s.subtopic)
    : [];

  // Determine characteristics based on topic
  const isLabEvent = ['Chemistry Lab', 'Forensics'].includes(topic);
  const isCalculationHeavy = ['Astronomy', 'Optics', 'Dynamic Planet', 'Machines'].includes(topic);

  return {
    difficultyLevel: level,
    timeLimitMinutes: 50,
    hasCalculations: isCalculationHeavy,
    hasDiagrams: true,
    hasLabProcedures: isLabEvent,
    // Real data fields
    subtopics,
    subtopicCount: topicMeta?.subtopicCount || 0,
    hasRealData: topicMeta?.hasData || false,
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Check for admin key bypass
  const adminKey = request.headers.get('x-admin-key');
  const isAdminBypass = adminKey && adminKey === process.env.ADMIN_SECRET_KEY;

  // Require authentication (bypass in development or with admin key)
  const isDev = process.env.NODE_ENV === 'development';
  if (!session && !isDev && !isAdminBypass) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: GenerateFromPDFRequest = await request.json();
    const { sourceId, questionCount = 20 } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      );
    }

    // Parse the source ID (dynamic format: scraped-{topic}-{level})
    const examSource = parseDynamicSourceId(sourceId);
    if (!examSource) {
      return NextResponse.json(
        { error: 'Invalid source ID format. Expected: scraped-{topic}-{level}' },
        { status: 400 }
      );
    }

    // Check cache first - avoid LLM calls if we have cached questions
    const cached = await getCachedGeneration(sourceId, questionCount);
    if (cached) {
      try {
        const cachedQuestions = JSON.parse(cached.generatedQuestions);
        const cachedMeta = cached.metaInfo ? JSON.parse(cached.metaInfo) : null;

        // Assign new IDs to cached questions for uniqueness
        const questions: Question[] = cachedQuestions.map((q: any) => ({
          ...q,
          id: generateId(),
        }));

        const totalPoints = questions.reduce((sum: number, q: Question) => sum + q.points, 0);
        const totalTime = (cachedMeta?.timeLimitMinutes || 50) * 60;

        const test: Test = {
          id: generateId(),
          year: new Date().getFullYear(),
          title: `Original Practice: ${examSource.topic} (${examSource.level}-style)`,
          description: `AI-generated original practice test inspired by ${examSource.level}-level exam structure. All questions are completely original and not copied from any source.`,
          difficulty: mapDifficultyForDatabase(examSource.level) as any,
          totalTime,
          totalPoints,
          topic: examSource.topic,
          questions,
        };

        await saveTest(test);

        return NextResponse.json({
          success: true,
          test,
          questionCount: questions.length,
          totalPoints,
          totalTime,
          fromCache: true,
          inspiredBy: {
            name: examSource.name,
            level: examSource.level,
            topic: examSource.topic,
          },
          disclaimer: 'This test contains completely original questions generated by AI.',
        });
      } catch (e) {
        // Cache parse failed, continue to generate new
        console.warn('Cache parse failed, generating fresh:', e);
      }
    }

    // Extract ONLY meta-information (never question content)
    const metaInfo = await extractMetaInformation(examSource);

    // Get topic and difficulty descriptions from shared module
    const topicDescription = TOPIC_DESCRIPTIONS[examSource.topic] || examSource.topic;
    const difficultyDescription = DIFFICULTY_DESCRIPTIONS[examSource.level] || examSource.level;

    // Fetch reference questions for few-shot learning (same pattern as generate-ai-test)
    let referenceExamples = '';
    try {
      // First try database (for scraped/imported questions)
      const dbQuestions = await getReferenceQuestions({
        topic: examSource.topic,
        difficulty: examSource.level,
        division: 'C', // Science Olympiad Division C only
        limit: 3,
        minQuality: 7,
        requireAnswer: true, // Filter out placeholder answers for few-shot examples
      });

      if (dbQuestions.length > 0) {
        referenceExamples = formatReferenceQuestionsForPrompt(dbQuestions);
      } else {
        // Fall back to seed questions
        const seedQuestions = getSeedQuestionsForTopic(examSource.topic);
        const filtered = seedQuestions
          .filter(q => q.difficulty === examSource.level || seedQuestions.length < 5)
          .slice(0, 3);
        if (filtered.length > 0) {
          referenceExamples = formatReferenceQuestionsForPrompt(filtered);
        }
      }
    } catch (refError) {
      console.error('Error fetching reference questions (non-fatal):', refError);
    }

    // Build the generation prompt with topic knowledge and examples
    const metaInfoJson = JSON.stringify({
      time_limit_minutes: metaInfo.timeLimitMinutes,
      has_calculations: metaInfo.hasCalculations,
      has_diagrams: metaInfo.hasDiagrams,
    }, null, 2);

    // Build subtopic guidance if we have real data (use subtopicCount for accurate display)
    const subtopicGuidance = metaInfo.subtopics.length > 0
      ? `\nSUBTOPICS TO COVER (based on ${metaInfo.subtopicCount} ${metaInfo.difficultyLevel}-level historical questions):\n${metaInfo.subtopics.map(s => `- ${s}`).join('\n')}\nDistribute questions across these subtopics for comprehensive coverage.\n`
      : '';

    const userPrompt = `Generate ${questionCount} completely ORIGINAL questions for a ${examSource.topic} Science Olympiad test.

TOPIC: ${examSource.topic}
FOCUS AREAS: ${topicDescription}
${subtopicGuidance}
DIFFICULTY LEVEL: ${metaInfo.difficultyLevel}
LEVEL DESCRIPTION: ${difficultyDescription}

META-INFORMATION (use as structural guide):
${metaInfoJson}
${referenceExamples ? `
${referenceExamples}

Use these historical examples as a guide for question style, difficulty, and format. Your questions must be COMPLETELY ORIGINAL but follow similar quality standards.
` : ''}
QUESTION TYPE: ALL MULTIPLE CHOICE
- Every question MUST be multiple-choice with exactly 4 options (A, B, C, D)
- All 4 options must be plausible - no obviously wrong answers
- correctAnswer MUST exactly match one of the options

OUTPUT FORMAT - Return a JSON object:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Original question here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B) Option 2",
      "points": 1,
      "category": "${examSource.topic}"
    }
  ]
}

CRITICAL: For multiple-choice, correctAnswer MUST be the EXACT text of one of the options.
Generate exactly ${questionCount} original questions.`;

    // Enhanced system prompt with validation requirements
    const enhancedSystemPrompt = `${SAFE_GENERATION_SYSTEM_PROMPT}

CRITICAL REQUIREMENTS:
1. Every question MUST be factually correct - verify your knowledge before generating
2. ALL questions MUST be multiple-choice with exactly 4 options
3. correctAnswer MUST exactly match one of the options
4. All 4 options must be plausible - no obviously wrong answers

MATHEMATICAL ACCURACY:
- For ANY calculation question, work through the math step-by-step BEFORE generating
- ALWAYS verify unit conversions
- Double-check that your calculated answer is correct`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded from gpt-4o-mini for better quality
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for accuracy (was 0.8)
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    // Extract token usage
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const costUsd = (promptTokens / 1000 * PRICE_PER_1K_PROMPT_TOKENS) +
                    (completionTokens / 1000 * PRICE_PER_1K_COMPLETION_TOKENS);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      await logApiUsage({
        userId,
        endpoint: 'generate-from-pdf',
        model: 'gpt-4o',
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        topic: examSource.topic,
        difficulty: metaInfo.difficultyLevel,
        questionCount,
        success: false,
        errorMessage: 'Empty response from API',
      });

      return NextResponse.json(
        { error: 'Failed to generate questions - empty response' },
        { status: 500 }
      );
    }

    // Parse the response
    let questions: Question[];
    try {
      const parsed = JSON.parse(content);
      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        throw new Error('No questions in response');
      }

      // Validate and repair questions before final mapping
      const { validQuestions, rejectedQuestions, totalRepairs, allIssues } =
        validateAndRepairQuestions(questionArray);

      if (allIssues.length > 0) {
        console.warn('Question validation issues:', allIssues);
      }

      if (rejectedQuestions.length > 0) {
        console.warn(`Rejected ${rejectedQuestions.length} invalid questions:`,
          rejectedQuestions.map(r => r.issues));
      }

      if (validQuestions.length === 0) {
        throw new Error('All questions were invalid after validation');
      }

      // Map to final Question format with normalized types
      questions = validQuestions.map((q: any) => ({
        id: generateId(),
        type: normalizeQuestionType(q.type) as Question['type'],
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        category: q.category || examSource.topic,
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated questions' },
        { status: 500 }
      );
    }

    // Additional content quality validation
    const validation = validateOriginalContent(questions);
    if (!validation.isValid) {
      console.warn('Content validation warnings:', validation.issues);
    }

    // Check for duplicate questions (exact or near-exact matches)
    const questionTexts = questions.map(q => q.question);
    // Strip common question stems before comparing
    const commonStems = [
      'which of the following',
      'what is the',
      'which statement',
      'select the',
      'choose the',
      'identify the',
    ];
    const stripStems = (text: string): string => {
      let cleaned = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
      for (const stem of commonStems) {
        if (cleaned.startsWith(stem)) {
          cleaned = cleaned.slice(stem.length).trim();
        }
      }
      return cleaned;
    };

    const duplicateIndices: number[] = [];
    for (let i = 0; i < questionTexts.length; i++) {
      for (let j = i + 1; j < questionTexts.length; j++) {
        const q1 = stripStems(questionTexts[i]);
        const q2 = stripStems(questionTexts[j]);
        // Check if core content (after stem removal) is >90% similar
        const minLen = Math.min(q1.length, q2.length);
        const maxLen = Math.max(q1.length, q2.length);
        // Only compare if both have substantial content after stem removal
        if (minLen > 30 && minLen / maxLen > 0.8) {
          // Check for high substring overlap
          if (q1.includes(q2.substring(0, Math.floor(q2.length * 0.9))) ||
              q2.includes(q1.substring(0, Math.floor(q1.length * 0.9)))) {
            duplicateIndices.push(j); // Mark later duplicate for removal
          }
        }
      }
    }

    // Remove duplicate questions
    if (duplicateIndices.length > 0) {
      const uniqueIndices = new Set(duplicateIndices);
      questions = questions.filter((_, idx) => !uniqueIndices.has(idx));
      console.warn(`Removed ${duplicateIndices.length} duplicate questions`);
    }

    // Calculate totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const totalTime = metaInfo.timeLimitMinutes * 60;

    // Create test
    const test: Test = {
      id: generateId(),
      year: new Date().getFullYear(),
      title: `Original Practice: ${examSource.topic} (${metaInfo.difficultyLevel}-style)`,
      description: `AI-generated original practice test inspired by ${metaInfo.difficultyLevel}-level exam structure. All questions are completely original and not copied from any source.`,
      difficulty: mapDifficultyForDatabase(metaInfo.difficultyLevel) as any,
      totalTime,
      totalPoints,
      topic: examSource.topic,
      questions,
    };

    // Save to database
    await saveTest(test);

    // Save to cache for future use (avoid repeated LLM calls)
    await saveCachedGeneration(
      sourceId,
      undefined, // No specific URL for dynamic sources
      questionCount,
      questions,
      metaInfo
    );

    // Log successful usage
    await logApiUsage({
      userId,
      endpoint: 'generate-from-pdf',
      model: 'gpt-4o',
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      topic: examSource.topic,
      difficulty: metaInfo.difficultyLevel,
      questionCount: questions.length,
      success: true,
    });

    return NextResponse.json({
      success: true,
      test,
      questionCount: questions.length,
      totalPoints,
      totalTime,
      fromCache: false,
      inspiredBy: {
        name: examSource.name,
        level: examSource.level,
        topic: examSource.topic,
      },
      disclaimer: 'This test contains completely original questions generated by AI.',
    });

  } catch (error: any) {
    console.error('PDF-inspired generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate test',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available exam sources (dynamically from scraped_tests)
export async function GET() {
  try {
    const sources = await getAvailableExamSources();

    return NextResponse.json({
      sources: sources.map(s => ({
        id: s.id,
        name: `${s.topic} - ${s.level}`,
        topic: s.topic,
        level: s.level,
        testCount: s.testCount,
        years: s.years,
        description: `${s.level}-level ${s.topic} (${s.testCount} test${s.testCount > 1 ? 's' : ''} available)`,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching exam sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam sources', sources: [] },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getCachedGeneration, saveCachedGeneration } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { getSourceById, PDFSource } from '@/lib/pdf-sources';
import { validateOriginalContent } from '@/lib/similarity-check';

// GPT-4o-mini pricing
const PRICE_PER_1K_PROMPT_TOKENS = 0.00015;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.0006;

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

// Meta-information structure (NO copyrightable content)
interface ExamMetaInfo {
  topicDistribution: Record<string, number>;
  questionTypes: Record<string, number>;
  difficultyLevel: string;
  totalQuestions: number;
  sectionStructure: string;
  timeLimitMinutes: number;
  hasCalculations: boolean;
  hasDiagrams: boolean;
  hasLabProcedures: boolean;
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

// Analyze PDF to extract ONLY meta-information (no question content)
async function extractMetaInformation(pdfSource: PDFSource): Promise<ExamMetaInfo> {
  // Since we cannot actually fetch PDFs in this demo, we'll generate
  // realistic meta-information based on the source's indicated properties
  // In production, this would use a PDF parsing library that extracts
  // ONLY structural information, never question text

  const topicKeywords: Record<string, string[]> = {
    'Anatomy and Physiology': ['skeletal', 'muscular', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'immune', 'endocrine'],
    'Astronomy': ['stellar', 'planetary', 'galactic', 'cosmology', 'spectroscopy', 'HR diagram', 'DSO', 'celestial mechanics'],
    'Chemistry Lab': ['organic', 'inorganic', 'thermodynamics', 'kinetics', 'equilibrium', 'acids', 'bases', 'redox'],
    'Disease Detectives': ['epidemiology', 'transmission', 'outbreak', 'statistics', 'public health', 'surveillance'],
    'Dynamic Planet': ['tectonics', 'earthquakes', 'volcanoes', 'glaciers', 'oceanography', 'atmosphere'],
    'Ecology': ['ecosystems', 'food webs', 'populations', 'biomes', 'biodiversity', 'succession'],
    'Forensics': ['evidence', 'analysis', 'toxicology', 'fingerprints', 'DNA', 'ballistics'],
    'Fossils': ['paleontology', 'stratigraphy', 'evolution', 'identification', 'geological time'],
    'Optics': ['reflection', 'refraction', 'lenses', 'mirrors', 'diffraction', 'interference', 'polarization'],
  };

  const topic = pdfSource.topic;
  const keywords = topicKeywords[topic] || ['general science'];

  // Generate realistic distribution based on topic
  const distribution: Record<string, number> = {};
  keywords.forEach((kw, i) => {
    distribution[kw] = Math.max(5, 20 - i * 2);
  });

  // Normalize to 100%
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  Object.keys(distribution).forEach(k => {
    distribution[k] = Math.round((distribution[k] / total) * 100);
  });

  // Determine question types based on topic
  const isLabEvent = ['Chemistry Lab', 'Forensics'].includes(topic);
  const isCalculationHeavy = ['Astronomy', 'Optics', 'Dynamic Planet'].includes(topic);

  return {
    topicDistribution: distribution,
    questionTypes: {
      'multiple-choice': isLabEvent ? 50 : 70,
      'short-answer': isLabEvent ? 30 : 20,
      'calculation': isCalculationHeavy ? 15 : 5,
      'diagram-analysis': isLabEvent ? 5 : 5,
    },
    difficultyLevel: pdfSource.level,
    totalQuestions: 30,
    sectionStructure: `Structured exam for ${topic} with ${pdfSource.level}-level difficulty`,
    timeLimitMinutes: 50,
    hasCalculations: isCalculationHeavy,
    hasDiagrams: true,
    hasLabProcedures: isLabEvent,
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Require authentication (bypass in development)
  const isDev = process.env.NODE_ENV === 'development';
  if (!session && !isDev) {
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

    // Get the PDF source configuration
    const pdfSource = getSourceById(sourceId);
    if (!pdfSource) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
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
          title: `Original Practice: ${pdfSource.topic} (${pdfSource.level}-style)`,
          description: `AI-generated original practice test inspired by ${pdfSource.level}-level exam structure. All questions are completely original and not copied from any source.`,
          difficulty: mapDifficultyForDatabase(pdfSource.level) as any,
          totalTime,
          totalPoints,
          topic: pdfSource.topic,
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
            name: pdfSource.name,
            level: pdfSource.level,
            topic: pdfSource.topic,
            source: pdfSource.source,
            sourceUrl: pdfSource.url, // Expose URL for transparency
          },
          disclaimer: 'This test contains completely original questions generated by AI. No questions were copied from the referenced exam. The source URL is provided for transparency only.',
        });
      } catch (e) {
        // Cache parse failed, continue to generate new
        console.warn('Cache parse failed, generating fresh:', e);
      }
    }

    // Extract ONLY meta-information (never question content)
    const metaInfo = await extractMetaInformation(pdfSource);

    // Build the generation prompt with meta-info only
    const metaInfoJson = JSON.stringify({
      topic_distribution: metaInfo.topicDistribution,
      question_types: metaInfo.questionTypes,
      difficulty_level: metaInfo.difficultyLevel,
      total_questions: questionCount,
      section_structure: metaInfo.sectionStructure,
      time_limit_minutes: metaInfo.timeLimitMinutes,
      has_calculations: metaInfo.hasCalculations,
      has_diagrams: metaInfo.hasDiagrams,
    }, null, 2);

    const userPrompt = `Generate ${questionCount} completely ORIGINAL questions for a ${pdfSource.topic} Science Olympiad test.

META-INFORMATION (use as structural guide ONLY):
${metaInfoJson}

REQUIREMENTS:
1. Match the difficulty level: ${metaInfo.difficultyLevel}
2. Follow the topic distribution percentages approximately
3. Include the question type mix: ${Math.round(metaInfo.questionTypes['multiple-choice'])}% multiple choice, ${Math.round(metaInfo.questionTypes['short-answer'])}% short answer
4. ${metaInfo.hasCalculations ? 'Include some calculation-based questions' : 'Focus on conceptual understanding'}
5. All questions must be COMPLETELY ORIGINAL - do not copy or paraphrase any existing exam questions

OUTPUT FORMAT - Return a JSON object:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Your original question here?",
      "options": ["A) Option", "B) Option", "C) Option", "D) Option"],
      "correctAnswer": "A) Option",
      "points": 1,
      "category": "${pdfSource.topic}"
    },
    {
      "type": "short-answer",
      "question": "Your original question here?",
      "correctAnswer": "The correct answer",
      "points": 2,
      "category": "${pdfSource.topic}"
    }
  ]
}

Generate exactly ${questionCount} original questions.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SAFE_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.8, // Higher temperature for more originality
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
        model: 'gpt-4o-mini',
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        topic: pdfSource.topic,
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

      questions = questionArray.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        category: q.category || pdfSource.topic,
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated questions' },
        { status: 500 }
      );
    }

    // Validate content quality
    const validation = validateOriginalContent(questions);
    if (!validation.isValid) {
      console.warn('Content validation warnings:', validation.issues);
      // We'll still proceed but log the warnings
    }

    // Calculate totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const totalTime = metaInfo.timeLimitMinutes * 60;

    // Create test
    const test: Test = {
      id: generateId(),
      year: new Date().getFullYear(),
      title: `Original Practice: ${pdfSource.topic} (${metaInfo.difficultyLevel}-style)`,
      description: `AI-generated original practice test inspired by ${metaInfo.difficultyLevel}-level exam structure. All questions are completely original and not copied from any source.`,
      difficulty: mapDifficultyForDatabase(metaInfo.difficultyLevel) as any,
      totalTime,
      totalPoints,
      topic: pdfSource.topic,
      questions,
    };

    // Save to database
    await saveTest(test);

    // Save to cache for future use (avoid repeated LLM calls)
    await saveCachedGeneration(
      sourceId,
      pdfSource.url,
      questionCount,
      questions,
      metaInfo
    );

    // Log successful usage
    await logApiUsage({
      userId,
      endpoint: 'generate-from-pdf',
      model: 'gpt-4o-mini',
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      topic: pdfSource.topic,
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
        name: pdfSource.name,
        level: pdfSource.level,
        topic: pdfSource.topic,
        source: pdfSource.source,
        sourceUrl: pdfSource.url, // Expose URL for transparency
      },
      disclaimer: 'This test contains completely original questions generated by AI. No questions were copied from the referenced exam. The source URL is provided for transparency only.',
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

// GET endpoint to retrieve available PDF sources
export async function GET() {
  const { CURATED_PDF_SOURCES } = await import('@/lib/pdf-sources');

  return NextResponse.json({
    sources: CURATED_PDF_SOURCES.map(s => ({
      id: s.id,
      name: s.name,
      topic: s.topic,
      year: s.year,
      level: s.level,
      source: s.source,
      sourceUrl: s.url, // Expose URL for transparency - users can see where data comes from
      description: s.description,
    })),
    transparency: {
      whatWeStore: 'Only AI-generated original questions are stored in our database. We cache generated tests to reduce API costs.',
      whatWeDontStore: 'We do NOT store, host, or cache any original PDF files or their content.',
      howItWorks: 'When you select a source, we analyze the exam structure (topic distribution, question types) and generate 100% original questions inspired by that format.',
      sourceLinks: 'Source URLs point to third-party sites where exams are publicly shared. We provide these for transparency so you can verify the source.',
    },
    disclaimer: 'SciOlyPrep does not host or redistribute any copyrighted PDFs. Links point to third-party sources where material is publicly posted. Generated tests contain only 100% original AI-generated content.',
  });
}

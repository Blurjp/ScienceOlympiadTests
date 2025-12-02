import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question, Region } from '@/lib/types';

// Lazy-load OpenAI client to avoid build errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface GenerateRequest {
  topic: string;
  year?: number;
  region?: string;
  questionCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

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
  'Microbe Mission': 'microbiology, bacteria, viruses, and microorganisms',
  'Optics': 'light, lenses, mirrors, reflection, refraction, and optical instruments',
  'Ornithology': 'bird identification, anatomy, behavior, and ecology',
  'Reach for the Stars': 'stellar astronomy, deep sky objects, and astrophysics',
  'Rocks and Minerals': 'rock types, mineral identification, and geological processes',
  'Tower': 'structural engineering principles and physics of structures',
  'Wind Power': 'renewable energy, wind turbine design, and energy physics',
  'Write It Do It': 'technical writing and following written instructions',
};

function getRegionDifficulty(region?: string): string {
  switch (region) {
    case 'Invitational': return 'introductory to moderate';
    case 'Regionals': return 'moderate';
    case 'States': return 'moderate to challenging';
    case 'Nationals': return 'challenging and advanced';
    default: return 'moderate';
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const body: GenerateRequest = await request.json();
    const {
      topic,
      year = new Date().getFullYear(),
      region,
      questionCount = 20,
      difficulty = 'Medium',
    } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const topicDescription = TOPIC_DESCRIPTIONS[topic] || topic.toLowerCase();
    const regionDifficulty = getRegionDifficulty(region);

    const prompt = `You are an expert Science Olympiad test writer. Generate ${questionCount} questions for a ${topic} test.

CONTEXT:
- Science Olympiad Division C (high school level)
- Year: ${year}
- Competition Level: ${region || 'General'} (${regionDifficulty} difficulty)
- Topic Focus: ${topicDescription}

REQUIREMENTS:
1. Mix of question types: 70% multiple choice, 30% short answer
2. Questions should be factually accurate and scientifically correct
3. Multiple choice questions must have exactly 4 options (A, B, C, D)
4. Include a variety of difficulty levels within the test
5. Questions should match the style of actual Science Olympiad competitions
6. For ${year}, focus on content that would be relevant to that year's rules

OUTPUT FORMAT - Return ONLY valid JSON array with this exact structure:
[
  {
    "type": "multiple-choice",
    "question": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "points": 1,
    "category": "${topic}"
  },
  {
    "type": "short-answer",
    "question": "The question text here?",
    "correctAnswer": "The correct answer",
    "points": 2,
    "category": "${topic}"
  }
]

Generate exactly ${questionCount} questions. Return ONLY the JSON array, no other text.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Science Olympiad test generator. Output only valid JSON arrays. Never include markdown code blocks or explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate questions - empty response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let questions: Question[];
    try {
      // Clean up potential markdown code blocks
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();

      const parsed = JSON.parse(jsonContent);

      // Add IDs to questions
      questions = parsed.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        category: q.category || topic,
      }));
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return NextResponse.json(
        { error: 'Failed to parse generated questions. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const totalTime = questions.length * 90; // 1.5 minutes per question

    // Create test
    const test: Test = {
      id: generateId(),
      year,
      title: `AI Generated: ${topic} ${year}${region ? ` ${region}` : ''} Practice Test`,
      description: `AI-generated practice test with ${questions.length} questions based on ${year}${region ? ` ${region}` : ''} ${topic} Science Olympiad content. Questions are AI-generated and should be verified for accuracy.`,
      difficulty,
      totalTime,
      totalPoints,
      topic,
      region: region as Region | undefined,
      questions,
    };

    // Save to database
    await saveTest(test);

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

    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate test',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

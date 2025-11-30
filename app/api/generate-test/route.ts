import { NextRequest, NextResponse } from 'next/server';
import { searchQuestions, saveTest } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';

interface GenerateTestRequest {
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  timePerQuestion?: number;
  includeTypes?: string[];
  categories?: string[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTestRequest = await request.json();

    const {
      topic,
      difficulty,
      questionCount = 20,
      timePerQuestion = 120, // 2 minutes per question
      includeTypes,
      categories,
    } = body;

    // Search for questions matching criteria
    const filters: any = {};
    if (topic) filters.topic = topic;
    if (difficulty) filters.difficulty = difficulty;

    let questions = await searchQuestions(filters);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found matching the criteria' },
        { status: 404 }
      );
    }

    // Filter by type if specified
    if (includeTypes && includeTypes.length > 0) {
      questions = questions.filter((q) => includeTypes.includes(q.type));
    }

    // Filter by category if specified
    if (categories && categories.length > 0) {
      questions = questions.filter((q) => categories.includes(q.category));
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found after applying filters' },
        { status: 404 }
      );
    }

    // Shuffle and select questions
    const shuffledQuestions = shuffleArray(questions);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(questionCount, questions.length));

    // Assign new IDs to avoid conflicts
    const newQuestions: Question[] = selectedQuestions.map((q) => ({
      ...q,
      id: generateId(),
    }));

    // Calculate total points and time
    const totalPoints = newQuestions.reduce((sum, q) => sum + q.points, 0);
    const totalTime = newQuestions.length * timePerQuestion;

    // Create test
    const test: Test = {
      id: generateId(),
      year: new Date().getFullYear(),
      title: `Generated Practice Test - ${topic || 'Mixed Topics'}`,
      description: `Auto-generated test with ${newQuestions.length} questions${topic ? ` on ${topic}` : ''}${difficulty ? ` (${difficulty})` : ''}`,
      difficulty: (difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      totalTime,
      totalPoints,
      topic: topic || 'Mixed',
      questions: newQuestions,
    };

    // Save to database
    try {
      await saveTest(test);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generated test' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test,
      questionCount: newQuestions.length,
      totalPoints,
      totalTime,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate test',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { searchQuestions, saveTest } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question, Region } from '@/lib/types';

interface GenerateTestRequest {
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  timePerQuestion?: number;
  includeTypes?: string[];
  categories?: string[];
  year?: number;
  region?: string;
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
      year,
      region,
    } = body;

    // Search for questions matching criteria
    const filters: any = {};
    if (topic) filters.topic = topic;
    if (difficulty) filters.difficulty = difficulty;
    if (year) filters.year = year;
    if (region) filters.region = region;

    let questions = await searchQuestions(filters);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found matching the criteria. Try adjusting your filters.' },
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
        { error: 'No questions found after applying filters. Try adjusting your filters.' },
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

    // Build descriptive title and description
    const titleParts: string[] = ['AI Generated'];
    if (topic) titleParts.push(topic);
    if (year) titleParts.push(year.toString());
    if (region) titleParts.push(region);
    titleParts.push('Practice Test');

    const descParts: string[] = [];
    descParts.push(`This practice test contains ${newQuestions.length} questions`);
    if (year || region || topic) {
      descParts.push('generated based on the style of');
      const styleParts: string[] = [];
      if (year) styleParts.push(year.toString());
      if (region) styleParts.push(region);
      if (topic) styleParts.push(topic);
      descParts.push(styleParts.join(' '));
      descParts.push('Science Olympiad tests.');
    }

    // Create test
    const test: Test = {
      id: generateId(),
      year: year || new Date().getFullYear(),
      title: titleParts.join(' '),
      description: descParts.join(' '),
      difficulty: (difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      totalTime,
      totalPoints,
      topic: topic || 'Mixed',
      region: region as Region | undefined,
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
      basedOn: {
        year: year || null,
        region: region || null,
        topic: topic || null,
      },
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

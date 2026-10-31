export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'diagram' | 'calculation';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  category: string;
}

export type Difficulty = 'Invitational' | 'Regional' | 'State' | 'National';

export type Region = 'Invitational' | 'Regionals' | 'States' | 'Nationals';

export interface Test {
  id: string;
  year: number;
  title: string;
  description: string;
  questions: Question[];
  difficulty: Difficulty;
  totalTime: number; // in seconds
  totalPoints: number;
  topic: string;
  region?: Region;
  /** Owner of the test (null for seeded/shared tests) */
  userId?: string | null;
  /** Whether the test appears in the shared public library. Private tests
   * (third-party imports) are only served to their owner or an admin. */
  isPublic?: boolean;
}

/**
 * Lightweight test representation for listings. Carries everything the
 * browse grid and stats need (including question count) without embedding
 * every question - keeps the homepage payload small.
 */
export interface TestSummary {
  id: string;
  year: number;
  title: string;
  description: string | null;
  difficulty: string;
  totalTime: number;
  totalPoints: number;
  topic: string;
  region?: string;
  userId?: string | null;
  questionCount: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
}

export interface TestResult {
  testId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  answers: UserAnswer[];
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
}

export type ViewType = 'browse' | 'test' | 'results' | 'parser';

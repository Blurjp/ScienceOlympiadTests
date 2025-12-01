export interface Question {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'diagram' | 'calculation';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  category: string;
}

export type Region = 'Invitational' | 'Regionals' | 'States' | 'Nationals';

export interface Test {
  id: string;
  year: number;
  title: string;
  description: string;
  questions: Question[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalTime: number; // in seconds
  totalPoints: number;
  topic: string;
  region?: Region;
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

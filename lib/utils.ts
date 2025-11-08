import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateScore(userAnswers: any[], questions: any[]): {
  score: number;
  correctAnswers: number;
  totalPoints: number;
} {
  let score = 0;
  let correctAnswers = 0;

  userAnswers.forEach(userAnswer => {
    const question = questions.find(q => q.id === userAnswer.questionId);
    if (question) {
      const isCorrect = userAnswer.answer.trim().toLowerCase() ===
                       question.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        score += question.points;
        correctAnswers++;
      }
    }
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return { score, correctAnswers, totalPoints };
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Hard':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

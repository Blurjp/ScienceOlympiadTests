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

// Normalize answer for comparison
function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    // Remove common punctuation
    .replace(/[.,;:!?'"()[\]{}]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common filler words at start
    .replace(/^(the|a|an)\s+/g, '')
    .trim();
}

// Check if user answer matches correct answer with flexibility
function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Exact match after normalization
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Check if user answer contains the correct answer (for short answers)
  if (normalizedCorrect.length <= 30 && normalizedUser.includes(normalizedCorrect)) {
    return true;
  }

  // Check if correct answer contains user answer (for abbreviations)
  if (normalizedUser.length >= 3 && normalizedCorrect.includes(normalizedUser)) {
    return true;
  }

  // Handle common number variations (1 vs one, 1st vs first)
  const numberWords: Record<string, string[]> = {
    '0': ['zero'], '1': ['one', 'first', '1st'], '2': ['two', 'second', '2nd'],
    '3': ['three', 'third', '3rd'], '4': ['four', 'fourth', '4th'],
    '5': ['five', 'fifth', '5th'], '6': ['six', 'sixth', '6th'],
    '7': ['seven', 'seventh', '7th'], '8': ['eight', 'eighth', '8th'],
    '9': ['nine', 'ninth', '9th'], '10': ['ten', 'tenth', '10th'],
  };

  for (const [num, words] of Object.entries(numberWords)) {
    const allForms = [num, ...words];
    const userHas = allForms.find(f => normalizedUser.includes(f));
    const correctHas = allForms.find(f => normalizedCorrect.includes(f));
    if (userHas && correctHas) {
      // Both have the same number, check rest of answer
      let userWithoutNum = normalizedUser;
      let correctWithoutNum = normalizedCorrect;
      allForms.forEach(f => {
        userWithoutNum = userWithoutNum.replace(f, '').trim();
        correctWithoutNum = correctWithoutNum.replace(f, '').trim();
      });
      if (userWithoutNum === correctWithoutNum ||
          (correctWithoutNum.length > 0 && userWithoutNum.includes(correctWithoutNum))) {
        return true;
      }
    }
  }

  return false;
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
      const correct = isAnswerCorrect(userAnswer.answer, question.correctAnswer);
      if (correct) {
        score += question.points;
        correctAnswers++;
      }
    }
  });

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return { score, correctAnswers, totalPoints };
}

// Export for use in results screen
export { isAnswerCorrect };

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    // Competition levels
    case 'Invitational':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Regional':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'State':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'National':
      return 'bg-red-100 text-red-800 border-red-200';
    // Legacy levels (backwards compatibility)
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

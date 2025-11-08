import { Question } from './types';
import { generateId } from './utils';

export function parseQuestionsFromText(text: string): Question[] {
  const questions: Question[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: string[] = [];
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for numbered question (e.g., "1.", "2.", etc.)
    const questionMatch = line.match(/^(\d+)\.\s*(.+)/);

    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.question) {
        questions.push(finalizeQuestion(currentQuestion, currentOptions));
      }

      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = {
        id: generateId(),
        question: questionMatch[2],
        points: 1,
        category: 'General'
      };
      currentOptions = [];
      continue;
    }

    // Check for multiple choice options (A., B., C., D.)
    const optionMatch = line.match(/^([A-D])\.\s*(.+)/);
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[2]);
      continue;
    }

    // Check for calculation/short answer indicators
    if (currentQuestion && currentQuestion.question) {
      const calcKeywords = ['Calculate', 'Find', 'Determine', 'What is', 'How much', 'How many'];
      const shortAnswerKeywords = ['Define', 'Explain', 'Describe', 'List', 'Name', 'Identify'];

      const questionText = currentQuestion.question;

      if (calcKeywords.some(kw => questionText.startsWith(kw))) {
        currentQuestion.type = 'calculation';
      } else if (shortAnswerKeywords.some(kw => questionText.startsWith(kw))) {
        currentQuestion.type = 'short-answer';
      }

      // Continue adding to question text if it spans multiple lines
      if (!optionMatch && !questionMatch && line.length > 0) {
        currentQuestion.question += ' ' + line;
      }
    }
  }

  // Add the last question
  if (currentQuestion && currentQuestion.question) {
    questions.push(finalizeQuestion(currentQuestion, currentOptions));
  }

  return questions;
}

function finalizeQuestion(
  question: Partial<Question>,
  options: string[]
): Question {
  const hasOptions = options.length >= 2;

  return {
    id: question.id || generateId(),
    type: hasOptions ? 'multiple-choice' : (question.type || 'short-answer'),
    question: question.question || '',
    options: hasOptions ? options : undefined,
    correctAnswer: hasOptions && options.length > 0 ? options[0] : '', // Default to first option
    points: question.points || 1,
    category: question.category || 'General'
  };
}

export function cleanPdfText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, ' ');

  // Remove page numbers
  cleaned = cleaned.replace(/Page \d+/gi, '');

  // Remove common headers/footers
  cleaned = cleaned.replace(/Science Olympiad/gi, '');

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');

  return cleaned.trim();
}

export function validateQuestion(question: Partial<Question>): boolean {
  if (!question.question || question.question.trim().length === 0) {
    return false;
  }

  if (question.type === 'multiple-choice') {
    if (!question.options || question.options.length < 2) {
      return false;
    }
  }

  if (!question.correctAnswer || question.correctAnswer.trim().length === 0) {
    return false;
  }

  return true;
}

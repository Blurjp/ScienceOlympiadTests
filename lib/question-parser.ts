import { Question } from './types';
import { generateId } from './utils';

export function parseQuestionsFromText(text: string): Question[] {
  const questions: Question[] = [];

  // Normalize the text first
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Strategy 1: Look for numbered questions with various formats
  // Matches: "1.", "1)", "1:", "Q1.", "Question 1", etc.
  const questionPatterns = [
    // "1. question" or "1) question" or "1: question"
    /(?:^|\n)\s*(\d+)\s*[.):\s]\s*([^\n]+(?:\n(?!\s*\d+\s*[.):\s])[^\n]+)*)/gm,
    // "Q1." or "Question 1"
    /(?:^|\n)\s*(?:Q|Question)\s*(\d+)[.):\s]*\s*([^\n]+(?:\n(?!\s*(?:Q|Question)\s*\d+)[^\n]+)*)/gim,
  ];

  for (const pattern of questionPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(normalizedText)) !== null) {
      const questionNum = parseInt(match[1]);
      let questionText = match[2].trim();

      // Skip if too short or looks like a page number
      if (questionText.length < 10) continue;
      if (/^[\d\s]+$/.test(questionText)) continue;

      // Extract multiple choice options
      const { mainQuestion, options } = extractOptions(questionText);

      // Extract point value if present
      const pointMatch = mainQuestion.match(/\((\d+)\s*(?:pts?|points?)\)/i);
      const points = pointMatch ? parseInt(pointMatch[1]) : 1;

      // Clean up the question text
      let cleanQuestion = mainQuestion
        .replace(/\((\d+)\s*(?:pts?|points?)\)/gi, '')
        .trim();

      if (cleanQuestion.length > 10) {
        questions.push({
          id: generateId(),
          type: options.length >= 2 ? 'multiple-choice' : 'short-answer',
          question: cleanQuestion,
          options: options.length >= 2 ? options : undefined,
          correctAnswer: '',
          points: points,
          category: 'General'
        });
      }
    }

    // If we found questions with this pattern, stop trying other patterns
    if (questions.length > 0) break;
  }

  // Strategy 2: If no numbered questions, look for any question-like sentences
  if (questions.length === 0) {
    const sentences = normalizedText.split(/[.?]\s+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();

      // Look for question indicators
      const isQuestion =
        trimmed.includes('?') ||
        /^(what|who|where|when|why|how|which|name|list|describe|explain|define|calculate|find|determine)/i.test(trimmed);

      if (isQuestion && trimmed.length > 20) {
        const { mainQuestion, options } = extractOptions(trimmed);

        questions.push({
          id: generateId(),
          type: options.length >= 2 ? 'multiple-choice' : 'short-answer',
          question: mainQuestion + (trimmed.includes('?') ? '' : '?'),
          options: options.length >= 2 ? options : undefined,
          correctAnswer: '',
          points: 1,
          category: 'General'
        });
      }
    }
  }

  // Strategy 3: If still nothing, just create chunks that can be edited
  if (questions.length === 0 && normalizedText.length > 50) {
    // Split into reasonable chunks
    const chunks = normalizedText.split(/\n\n+/);

    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (trimmed.length > 30) {
        questions.push({
          id: generateId(),
          type: 'short-answer',
          question: trimmed.substring(0, 500), // Limit length
          correctAnswer: '',
          points: 1,
          category: 'General'
        });
      }
    }
  }

  return questions;
}

function extractOptions(text: string): { mainQuestion: string; options: string[] } {
  const options: string[] = [];
  let mainQuestion = text;

  // Pattern 1: A. B. C. D. or A) B) C) D)
  const optionPattern1 = /\b([A-Da-d])\s*[.)]\s*([^A-Da-d\n]+?)(?=\s*[A-Da-d]\s*[.)]|$)/g;

  // Pattern 2: (A) (B) (C) (D)
  const optionPattern2 = /\(([A-Da-d])\)\s*([^()]+?)(?=\s*\([A-Da-d]\)|$)/g;

  let match;
  let optionsStart = -1;

  // Try pattern 1
  optionPattern1.lastIndex = 0;
  while ((match = optionPattern1.exec(text)) !== null) {
    if (optionsStart === -1) optionsStart = match.index;
    const optText = match[2].trim();
    if (optText.length > 0 && optText.length < 200) {
      options.push(optText);
    }
  }

  // Try pattern 2 if pattern 1 didn't work
  if (options.length < 2) {
    options.length = 0;
    optionsStart = -1;
    optionPattern2.lastIndex = 0;
    while ((match = optionPattern2.exec(text)) !== null) {
      if (optionsStart === -1) optionsStart = match.index;
      const optText = match[2].trim();
      if (optText.length > 0 && optText.length < 200) {
        options.push(optText);
      }
    }
  }

  // Extract main question (text before options)
  if (optionsStart > 0 && options.length >= 2) {
    mainQuestion = text.substring(0, optionsStart).trim();
  }

  return { mainQuestion, options };
}

export function cleanPdfText(text: string): string {
  let cleaned = text;

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');

  // Replace multiple spaces with single space (but keep newlines)
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Replace 3+ newlines with 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove standalone page numbers
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');
  cleaned = cleaned.replace(/\bPage\s*\d+\b/gi, '');

  // Remove common headers/footers
  cleaned = cleaned.replace(/Science Olympiad/gi, '');
  cleaned = cleaned.replace(/Division\s*[ABC]/gi, '');
  cleaned = cleaned.replace(/\bName:?\s*_*\s*/gi, '');
  cleaned = cleaned.replace(/\bTeam:?\s*_*\s*/gi, '');
  cleaned = cleaned.replace(/\bNumber:?\s*_*\s*/gi, '');

  // Clean up spacing around punctuation
  cleaned = cleaned.replace(/\s+([.,;:?!])/g, '$1');

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

  return true;
}

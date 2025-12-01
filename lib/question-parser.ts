import { Question } from './types';
import { generateId } from './utils';

export function parseQuestionsFromText(text: string): Question[] {
  const questions: Question[] = [];

  // Try multiple parsing strategies

  // Strategy 1: Look for numbered questions (1. 2. 3. etc)
  const numberedPattern = /(?:^|\n|\s)(\d+)\.\s*([^]*?)(?=(?:\n|\s)\d+\.|$)/g;
  let match;

  while ((match = numberedPattern.exec(text)) !== null) {
    const questionNum = parseInt(match[1]);
    let questionText = match[2].trim();

    // Check for multiple choice options within the question text
    const options: string[] = [];
    const optionPattern = /([A-D])\.\s*([^A-D.]+?)(?=\s*[A-D]\.|$)/g;
    let optMatch;
    let mainQuestion = questionText;

    while ((optMatch = optionPattern.exec(questionText)) !== null) {
      options.push(optMatch[2].trim());
      // Remove options from main question
      mainQuestion = questionText.substring(0, questionText.indexOf(optMatch[0])).trim();
    }

    if (mainQuestion.length > 10) { // Minimum question length
      questions.push({
        id: generateId(),
        type: options.length >= 2 ? 'multiple-choice' : 'short-answer',
        question: mainQuestion,
        options: options.length >= 2 ? options : undefined,
        correctAnswer: options.length > 0 ? options[0] : '',
        points: 1,
        category: 'General'
      });
    }
  }

  // Strategy 2: If no numbered questions found, try splitting by common patterns
  if (questions.length === 0) {
    // Split by question marks followed by space/newline and a capital letter or number
    const parts = text.split(/\?\s+(?=[A-Z0-9])/);

    for (let i = 0; i < parts.length - 1; i++) { // -1 because last part after ? might not be a question
      const questionText = parts[i].trim() + '?';

      // Skip very short segments
      if (questionText.length < 20) continue;

      // Clean up the question text
      const cleaned = questionText.replace(/^\d+\.\s*/, ''); // Remove leading numbers

      if (cleaned.length > 15) {
        questions.push({
          id: generateId(),
          type: 'short-answer',
          question: cleaned,
          correctAnswer: '',
          points: 1,
          category: 'General'
        });
      }
    }
  }

  // Strategy 3: If still nothing, create one question per significant paragraph
  if (questions.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);

    paragraphs.forEach((para, index) => {
      const cleaned = para.trim();
      if (cleaned.length > 30 && cleaned.includes('?')) {
        questions.push({
          id: generateId(),
          type: 'short-answer',
          question: cleaned,
          correctAnswer: '',
          points: 1,
          category: 'General'
        });
      }
    });
  }

  return questions;
}

export function cleanPdfText(text: string): string {
  // Normalize different types of whitespace but preserve structure
  let cleaned = text;

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');

  // Replace 3+ newlines with 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove page numbers
  cleaned = cleaned.replace(/Page\s*\d+/gi, '');
  cleaned = cleaned.replace(/^\d+\s*$/gm, ''); // Standalone numbers (page numbers)

  // Remove common headers/footers but keep content
  cleaned = cleaned.replace(/Science Olympiad\s*(Division [ABC])?/gi, '');
  cleaned = cleaned.replace(/Name:?\s*_+/gi, '');
  cleaned = cleaned.replace(/Team:?\s*_+/gi, '');
  cleaned = cleaned.replace(/Score:?\s*_+/gi, '');

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

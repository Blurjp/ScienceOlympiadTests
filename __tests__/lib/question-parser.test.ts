/**
 * Tests for lib/question-parser.ts
 */
import { parseQuestionsFromText, cleanPdfText, validateQuestion } from '@/lib/question-parser';

describe('parseQuestionsFromText', () => {
  describe('numbered questions with period', () => {
    test('parses simple numbered questions', () => {
      const text = `
        1. What is the capital of France?
        2. What is the largest planet in our solar system?
        3. What is the chemical symbol for water?
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(3);
      expect(questions[0].question).toContain('capital of France');
      expect(questions[1].question).toContain('largest planet');
      expect(questions[2].question).toContain('chemical symbol');
    });

    test('parses questions with point values', () => {
      const text = `
        1. (2 pts) What is the capital of France?
        2. (3 points) What is the largest planet?
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
      expect(questions[0].points).toBe(2);
      expect(questions[1].points).toBe(3);
    });

    test('parses multiple choice questions', () => {
      // The parser extracts options from inline format
      const text = `1. What is the capital of France? (A) London (B) Paris (C) Berlin (D) Madrid`;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(1);
      // Check that the question was parsed
      expect(questions[0].question).toContain('capital of France');
    });
  });

  describe('numbered questions with parenthesis', () => {
    test('parses questions with parenthesis numbering', () => {
      const text = `
        1) What is the speed of light?
        2) What is the atomic number of carbon?
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
      expect(questions[0].question).toContain('speed of light');
    });
  });

  describe('Question prefix format', () => {
    test('parses Question N format', () => {
      const text = `
        Question 1: What is photosynthesis?
        Question 2: Describe the water cycle.
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
    });

    test('parses Q1 format', () => {
      const text = `
        Q1. What is the mitochondria?
        Q2. What is DNA?
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
    });
  });

  describe('question-like sentences fallback', () => {
    test('identifies questions by question words', () => {
      const text = `
        What is the function of the heart?
        How does respiration work in humans?
        Why do leaves change color in autumn?
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBeGreaterThan(0);
    });

    test('identifies imperative questions', () => {
      const text = `
        Name the three types of rocks.
        List the planets in order.
        Describe the process of mitosis.
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBeGreaterThan(0);
    });
  });

  describe('chunk fallback', () => {
    test('creates chunks from unstructured text', () => {
      const text = `
        This is a long paragraph about science that doesn't follow any question format.

        This is another paragraph with different content about biology and chemistry.

        And here is a third paragraph discussing physics and astronomy topics.
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].type).toBe('short-answer');
    });
  });

  describe('edge cases', () => {
    test('skips short content', () => {
      const text = '1. Hi';
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(0);
    });

    test('skips numeric-only content', () => {
      const text = '1. 12345';
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(0);
    });

    test('handles empty text', () => {
      const questions = parseQuestionsFromText('');
      expect(questions.length).toBe(0);
    });

    test('handles Windows line endings', () => {
      const text = '1. What is biology?\r\n2. What is chemistry?';
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
    });

    test('handles old Mac line endings', () => {
      const text = '1. What is biology?\r2. What is chemistry?';
      const questions = parseQuestionsFromText(text);
      expect(questions.length).toBe(2);
    });

    test('assigns default category', () => {
      const text = '1. What is the speed of sound in air?';
      const questions = parseQuestionsFromText(text);
      expect(questions[0].category).toBe('General');
    });

    test('assigns unique IDs', () => {
      const text = `
        1. Question one text here
        2. Question two text here
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions[0].id).not.toBe(questions[1].id);
    });
  });

  describe('multiple choice option extraction', () => {
    test('extracts A) B) C) D) format options', () => {
      const text = `
        1. What is 2+2?
        A) 3
        B) 4
        C) 5
        D) 6
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions[0].type).toBe('multiple-choice');
      expect(questions[0].options?.length).toBeGreaterThanOrEqual(2);
    });

    test('extracts (A) (B) (C) (D) format options', () => {
      const text = `
        1. What color is the sky?
        (A) Red
        (B) Blue
        (C) Green
        (D) Yellow
      `;
      const questions = parseQuestionsFromText(text);
      expect(questions[0].type).toBe('multiple-choice');
    });
  });
});

describe('cleanPdfText', () => {
  test('normalizes CRLF to LF', () => {
    const text = 'Line1\r\nLine2\r\nLine3';
    const result = cleanPdfText(text);
    expect(result).not.toContain('\r');
  });

  test('normalizes CR to LF', () => {
    const text = 'Line1\rLine2\rLine3';
    const result = cleanPdfText(text);
    expect(result).not.toContain('\r');
  });

  test('reduces multiple spaces to single space', () => {
    const text = 'Word1    Word2     Word3';
    const result = cleanPdfText(text);
    expect(result).toBe('Word1 Word2 Word3');
  });

  test('reduces multiple newlines to double newline', () => {
    const text = 'Para1\n\n\n\nPara2';
    const result = cleanPdfText(text);
    expect(result).toBe('Para1\n\nPara2');
  });

  test('removes standalone page numbers', () => {
    const text = 'Content\n1\nMore content\n2\nEnd';
    const result = cleanPdfText(text);
    expect(result).not.toMatch(/^\d+$/m);
  });

  test('removes "Page N" patterns', () => {
    const text = 'Content Page 1 more Page 23 content';
    const result = cleanPdfText(text);
    expect(result).not.toContain('Page 1');
    expect(result).not.toContain('Page 23');
  });

  test('removes Science Olympiad text', () => {
    const text = 'Science Olympiad Test Content';
    const result = cleanPdfText(text);
    expect(result.toLowerCase()).not.toContain('science olympiad');
  });

  test('removes Division markers', () => {
    const text = 'Division A content Division B Division C';
    const result = cleanPdfText(text);
    expect(result).not.toMatch(/Division\s*[ABC]/i);
  });

  test('removes Name field', () => {
    const text = 'Name: ______ Content here';
    const result = cleanPdfText(text);
    expect(result).not.toMatch(/Name:?\s*_*/i);
  });

  test('removes Team field', () => {
    const text = 'Team: ______ Content here';
    const result = cleanPdfText(text);
    expect(result).not.toMatch(/Team:?\s*_*/i);
  });

  test('removes Number field', () => {
    const text = 'Number: ______ Content here';
    const result = cleanPdfText(text);
    expect(result).not.toMatch(/Number:?\s*_*/i);
  });

  test('cleans spacing around punctuation', () => {
    const text = 'Word , another . third ; fourth : fifth ?';
    const result = cleanPdfText(text);
    expect(result).toBe('Word, another. third; fourth: fifth?');
  });

  test('trims whitespace', () => {
    const text = '   Content here   ';
    const result = cleanPdfText(text);
    expect(result).toBe('Content here');
  });

  test('handles tabs', () => {
    const text = 'Word1\t\tWord2\tWord3';
    const result = cleanPdfText(text);
    expect(result).toBe('Word1 Word2 Word3');
  });
});

describe('validateQuestion', () => {
  test('validates complete multiple-choice question', () => {
    const question = {
      question: 'What is the capital of France?',
      type: 'multiple-choice' as const,
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
    };
    expect(validateQuestion(question)).toBe(true);
  });

  test('validates complete short-answer question', () => {
    const question = {
      question: 'Explain the process of photosynthesis.',
      type: 'short-answer' as const,
    };
    expect(validateQuestion(question)).toBe(true);
  });

  test('rejects question with empty text', () => {
    const question = {
      question: '',
      type: 'short-answer' as const,
    };
    expect(validateQuestion(question)).toBe(false);
  });

  test('rejects question with only whitespace', () => {
    const question = {
      question: '   ',
      type: 'short-answer' as const,
    };
    expect(validateQuestion(question)).toBe(false);
  });

  test('rejects multiple-choice without options', () => {
    const question = {
      question: 'What is 2+2?',
      type: 'multiple-choice' as const,
    };
    expect(validateQuestion(question)).toBe(false);
  });

  test('rejects multiple-choice with only one option', () => {
    const question = {
      question: 'What is 2+2?',
      type: 'multiple-choice' as const,
      options: ['4'],
    };
    expect(validateQuestion(question)).toBe(false);
  });

  test('accepts multiple-choice with two options', () => {
    const question = {
      question: 'Is the sky blue?',
      type: 'multiple-choice' as const,
      options: ['Yes', 'No'],
    };
    expect(validateQuestion(question)).toBe(true);
  });

  test('rejects missing question field', () => {
    const question = {
      type: 'short-answer' as const,
    };
    expect(validateQuestion(question)).toBe(false);
  });

  test('accepts short-answer with empty options', () => {
    const question = {
      question: 'Describe mitosis.',
      type: 'short-answer' as const,
      options: [],
    };
    expect(validateQuestion(question)).toBe(true);
  });
});

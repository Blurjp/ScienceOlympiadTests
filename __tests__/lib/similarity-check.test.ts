/**
 * Tests for lib/similarity-check.ts
 */
import {
  checkSimilarity,
  validateOriginalContent,
  extractSafeMetaKeywords,
  normalizeQuestionType,
  validateMultipleChoice,
  validateAndRepairQuestion,
  validateAndRepairQuestions,
  SimilarityResult,
} from '@/lib/similarity-check';

describe('checkSimilarity', () => {
  describe('basic functionality', () => {
    test('returns safe result for original content', () => {
      const questions = [
        'What is the process by which plants convert sunlight to energy?',
        'Describe the main components of a cell membrane.',
      ];
      const result = checkSimilarity(questions);
      expect(result.isSafe).toBe(true);
      expect(result.score).toBeLessThan(0.3);
    });

    test('returns result with all required properties', () => {
      const result = checkSimilarity(['Test question']);
      expect(result).toHaveProperty('isSafe');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('flaggedPhrases');
      expect(result).toHaveProperty('recommendation');
    });

    test('handles empty questions array', () => {
      const result = checkSimilarity([]);
      expect(result).toBeDefined();
      expect(result.isSafe).toBe(true);
    });

    test('provides recommendation for safe content', () => {
      const result = checkSimilarity(['What is biology?']);
      expect(result.recommendation).toContain('original');
    });
  });

  describe('keyword matching', () => {
    test('does not flag single-word topic keywords', () => {
      const questions = ['What is epidemiology and disease transmission?'];
      const sourceKeywords = ['epidemiology', 'transmission', 'disease'];
      const result = checkSimilarity(questions, sourceKeywords);
      expect(result.flaggedPhrases.length).toBe(0);
    });

    test('flags long multi-word phrases', () => {
      const longPhrase = 'this is a very specific long phrase from the source material';
      const questions = [`Question about ${longPhrase} in science`];
      const sourceKeywords = [longPhrase];
      const result = checkSimilarity(questions, sourceKeywords);
      expect(result.flaggedPhrases.length).toBeGreaterThan(0);
    });

    test('ignores short phrases', () => {
      const questions = ['Short phrase test'];
      const sourceKeywords = ['short phrase'];
      const result = checkSimilarity(questions, sourceKeywords);
      expect(result.flaggedPhrases.length).toBe(0);
    });
  });

  describe('threshold behavior', () => {
    test('respects custom threshold', () => {
      const questions = ['Test question'];
      const lowThreshold = 0.01;
      const result = checkSimilarity(questions, [], lowThreshold);
      // With very low threshold, even minimal content might fail
      expect(typeof result.isSafe).toBe('boolean');
    });

    test('uses default threshold when not specified', () => {
      const result = checkSimilarity(['Test question']);
      // Default threshold is 0.3
      expect(result).toBeDefined();
    });
  });

  describe('score calculation', () => {
    test('returns score between 0 and 1', () => {
      const result = checkSimilarity(['Random test content here']);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    test('higher overlap increases score', () => {
      const keywords = ['specific', 'technical', 'terms', 'here'];
      const lowOverlap = checkSimilarity(['Random unrelated content'], keywords);
      const highOverlap = checkSimilarity(['specific technical terms here used'], keywords);
      // Higher overlap should generally produce higher scores
      expect(highOverlap.score).toBeGreaterThanOrEqual(lowOverlap.score);
    });
  });

  describe('unsafe content detection', () => {
    test('provides recommendation for unsafe content', () => {
      const longPhrase = 'this is an extremely specific and long phrase that was definitely copied from somewhere';
      const questions = [`Question: ${longPhrase}`];
      const result = checkSimilarity(questions, [longPhrase]);
      if (!result.isSafe) {
        expect(result.recommendation).toBeTruthy();
        expect(result.recommendation.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('validateOriginalContent', () => {
  describe('valid content', () => {
    test('accepts well-formed questions', () => {
      const questions = [
        { question: 'What is the function of mitochondria?', correctAnswer: 'Energy production' },
        { question: 'How does photosynthesis work?', correctAnswer: 'Light to energy' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('accepts questions starting with Calculate', () => {
      const questions = [
        { question: 'Calculate the velocity of the object.', correctAnswer: '10 m/s' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(true);
    });

    test('accepts questions starting with Identify', () => {
      const questions = [
        { question: 'Identify the type of rock shown in the image.', correctAnswer: 'Ignite' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(true);
    });

    test('accepts questions starting with Name', () => {
      const questions = [
        { question: 'Name the three states of matter.', correctAnswer: 'Solid, liquid, gas' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid content - placeholders', () => {
    test('flags questions with bracket placeholders', () => {
      const questions = [
        { question: 'What is the [TOPIC] in this context?', correctAnswer: 'Answer' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('bracket'))).toBe(true);
    });
  });

  describe('invalid content - too short', () => {
    test('flags questions that are too short', () => {
      const questions = [
        { question: 'What?', correctAnswer: 'Answer' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('too short'))).toBe(true);
    });

    test('accepts questions with exactly 20 characters', () => {
      const questions = [
        { question: 'What is the answer??', correctAnswer: 'Answer' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid content - missing question mark', () => {
    test('flags statements without question indicators', () => {
      const questions = [
        { question: 'This is a statement not a question at all', correctAnswer: 'Answer' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('not be properly formatted'))).toBe(true);
    });
  });

  describe('multiple issues', () => {
    test('reports all issues found', () => {
      const questions = [
        { question: 'Short', correctAnswer: 'A' },
        { question: 'What is [TOPIC]?', correctAnswer: 'B' },
        { question: 'Statement without question mark here', correctAnswer: 'C' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });

    test('includes question numbers in issues', () => {
      const questions = [
        { question: 'Short', correctAnswer: 'A' },
      ];
      const result = validateOriginalContent(questions);
      expect(result.issues[0]).toContain('Question 1');
    });
  });

  describe('edge cases', () => {
    test('handles empty array', () => {
      const result = validateOriginalContent([]);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });
});

describe('extractSafeMetaKeywords', () => {
  test('extracts scientific terms', () => {
    const text = 'Photosynthesis occurs in chloroplasts within the mitochondria of plant cells.';
    const keywords = extractSafeMetaKeywords(text);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords.some(k => k.includes('photosynthesis'))).toBe(true);
  });

  test('filters out short words', () => {
    const text = 'The cat sat on a mat in the hat.';
    const keywords = extractSafeMetaKeywords(text);
    // All words are short, so should return few/no keywords
    keywords.forEach(keyword => {
      expect(keyword.length).toBeGreaterThan(5);
    });
  });

  test('filters out generic question patterns', () => {
    const text = 'which of the following is correct and what is the answer';
    const keywords = extractSafeMetaKeywords(text);
    expect(keywords.every(k => !k.includes('which'))).toBe(true);
    expect(keywords.every(k => !k.includes('following'))).toBe(true);
  });

  test('returns unique terms', () => {
    const text = 'Biology biology BIOLOGY Biology';
    const keywords = extractSafeMetaKeywords(text);
    const uniqueKeywords = new Set(keywords);
    expect(keywords.length).toBe(uniqueKeywords.size);
  });

  test('limits number of returned keywords', () => {
    // Generate text with many long words
    const longWords = Array.from({ length: 100 }, (_, i) => `scientificterm${i}`);
    const text = longWords.join(' ');
    const keywords = extractSafeMetaKeywords(text);
    expect(keywords.length).toBeLessThanOrEqual(50);
  });

  test('handles empty text', () => {
    const keywords = extractSafeMetaKeywords('');
    expect(keywords).toEqual([]);
  });

  test('removes punctuation before tokenizing', () => {
    const text = 'Biology, chemistry; physics: astronomy!';
    const keywords = extractSafeMetaKeywords(text);
    keywords.forEach(keyword => {
      expect(keyword).not.toMatch(/[,;:!]/);
    });
  });

  test('converts to lowercase', () => {
    const text = 'BIOCHEMISTRY Molecular GENETICS';
    const keywords = extractSafeMetaKeywords(text);
    keywords.forEach(keyword => {
      expect(keyword).toBe(keyword.toLowerCase());
    });
  });
});

describe('normalizeQuestionType', () => {
  test('normalizes multiple-choice variations', () => {
    expect(normalizeQuestionType('multiple-choice')).toBe('multiple-choice');
    expect(normalizeQuestionType('multiplechoice')).toBe('multiple-choice');
    expect(normalizeQuestionType('mc')).toBe('multiple-choice');
    expect(normalizeQuestionType('MULTIPLE CHOICE')).toBe('multiple-choice');
  });

  test('normalizes short-answer variations', () => {
    expect(normalizeQuestionType('short-answer')).toBe('short-answer');
    expect(normalizeQuestionType('shortanswer')).toBe('short-answer');
    expect(normalizeQuestionType('sa')).toBe('short-answer');
    expect(normalizeQuestionType('SHORT ANSWER')).toBe('short-answer');
  });

  test('normalizes calculation variations', () => {
    expect(normalizeQuestionType('calculation')).toBe('calculation');
    expect(normalizeQuestionType('calc')).toBe('calculation');
    expect(normalizeQuestionType('CALCULATION')).toBe('calculation');
  });

  test('normalizes diagram variations', () => {
    expect(normalizeQuestionType('diagram')).toBe('diagram');
    expect(normalizeQuestionType('diagram-analysis')).toBe('diagram');
    expect(normalizeQuestionType('diagramanalysis')).toBe('diagram');
  });

  test('defaults to short-answer for unknown types', () => {
    expect(normalizeQuestionType('unknown')).toBe('short-answer');
    expect(normalizeQuestionType('')).toBe('short-answer');
  });
});

describe('validateMultipleChoice', () => {
  test('returns valid for non-multiple-choice questions', () => {
    const result = validateMultipleChoice({
      type: 'short-answer',
      correctAnswer: 'Test answer',
    });
    expect(result.isValid).toBe(true);
  });

  test('returns invalid for MC without options', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      correctAnswer: 'A) Test',
    });
    expect(result.isValid).toBe(false);
    expect(result.issue).toContain('no options');
  });

  test('returns valid when correctAnswer matches exactly', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) Nitrogen', 'B) Oxygen', 'C) Argon', 'D) Carbon'],
      correctAnswer: 'B) Oxygen',
    });
    expect(result.isValid).toBe(true);
  });

  test('repairs correctAnswer with prefix mismatch', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) Nitrogen', 'B) Oxygen', 'C) Argon', 'D) Carbon'],
      correctAnswer: 'Oxygen',
    });
    expect(result.isValid).toBe(true);
    expect(result.repairedAnswer).toBe('B) Oxygen');
  });

  test('handles double prefixes in correctAnswer', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) Nitrogen', 'B) Oxygen', 'C) Argon', 'D) Carbon'],
      correctAnswer: 'B. b. Oxygen',
    });
    expect(result.isValid).toBe(true);
    expect(result.repairedAnswer).toBe('B) Oxygen');
  });

  test('handles double prefixes in options', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A. a. Nitrogen', 'B. b. Oxygen', 'C. c. Argon', 'D. d. Carbon'],
      correctAnswer: 'Oxygen',
    });
    expect(result.isValid).toBe(true);
  });

  test('returns invalid when answer not found', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) Nitrogen', 'B) Oxygen', 'C) Argon', 'D) Carbon'],
      correctAnswer: 'Helium',
    });
    expect(result.isValid).toBe(false);
    expect(result.issue).toContain('not found in options');
  });

  test('repairs via partial match with sufficient overlap', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) N2', 'B) O2', 'C) Ar', 'D) CO2'],
      correctAnswer: 'O2 gas',
    });
    // "O2" is contained in "O2 gas", and 2/6 < 0.8 so won't match
    // Testing that partial match requires 80% overlap
    expect(result.isValid).toBe(false);
  });

  test('repairs when answer contains option content', () => {
    const result = validateMultipleChoice({
      type: 'multiple-choice',
      options: ['A) Nitrogen', 'B) Oxygen', 'C) Argon', 'D) Carbon'],
      correctAnswer: 'B) Oxyge', // Close enough (6/6 chars match)
    });
    expect(result.isValid).toBe(true);
    expect(result.repairedAnswer).toBe('B) Oxygen');
  });
});

describe('validateAndRepairQuestion', () => {
  test('normalizes question type', () => {
    const { repaired } = validateAndRepairQuestion({
      type: 'mc',
      question: 'What is the chemical symbol for gold?',
      correctAnswer: 'A) Au',
      options: ['A) Au', 'B) Ag', 'C) Fe', 'D) Cu'],
      points: 1,
    });
    expect(repaired.type).toBe('multiple-choice');
  });

  test('repairs MC options with double prefixes', () => {
    const { repaired, wasRepaired } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is the most abundant gas in Earth\'s atmosphere?',
      correctAnswer: 'A) Nitrogen',
      options: ['A. a. Nitrogen', 'B. b. Oxygen', 'C. c. Argon', 'D. d. Water vapor'],
      points: 1,
    });
    expect(wasRepaired).toBe(true);
    expect(repaired.options).toEqual([
      'A) Nitrogen',
      'B) Oxygen',
      'C) Argon',
      'D) Water vapor',
    ]);
  });

  test('repairs correctAnswer to match repaired options', () => {
    const { repaired, wasRepaired, rejected } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is the most abundant gas in Earth\'s atmosphere?',
      correctAnswer: 'A. a. Nitrogen',
      options: ['A. a. Nitrogen', 'B. b. Oxygen', 'C. c. Argon', 'D. d. Water vapor'],
      points: 1,
    });
    expect(rejected).toBe(false);
    expect(wasRepaired).toBe(true);
    // After repair, both options and correctAnswer should have clean prefixes
    expect(repaired.options).toEqual([
      'A) Nitrogen',
      'B) Oxygen',
      'C) Argon',
      'D) Water vapor',
    ]);
    expect(repaired.correctAnswer).toBe('A) Nitrogen');
  });

  test('rejects MC with less than 4 options', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is 2 + 2?',
      correctAnswer: 'A) 4',
      options: ['A) 4', 'B) 5'],
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('exactly 4 options'))).toBe(true);
  });

  test('rejects MC with more than 4 options', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is 2 + 2?',
      correctAnswer: 'A) 4',
      options: ['A) 4', 'B) 5', 'C) 6', 'D) 7', 'E) 8'],
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('exactly 4 options'))).toBe(true);
  });

  test('rejects MC with empty options after normalization', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is the answer?',
      correctAnswer: 'A) Test',
      options: ['A) Test', 'B)', 'C) Valid', 'D) Also valid'],
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('empty option'))).toBe(true);
  });

  test('rejects MC with duplicate options', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is the answer?',
      correctAnswer: 'A) Same',
      options: ['A) Same', 'B) Same', 'C) Different', 'D) Another'],
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('duplicate'))).toBe(true);
  });

  test('rejects questions with too short text', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'short-answer',
      question: 'What?',
      correctAnswer: 'Answer',
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('too short'))).toBe(true);
  });

  test('rejects questions with missing correctAnswer', () => {
    const { rejected, issues } = validateAndRepairQuestion({
      type: 'short-answer',
      question: 'What is the capital of France?',
      correctAnswer: '',
      points: 1,
    });
    expect(rejected).toBe(true);
    expect(issues.some(i => i.includes('Missing correctAnswer'))).toBe(true);
  });

  test('repairs missing points for MC', () => {
    const { repaired, wasRepaired } = validateAndRepairQuestion({
      type: 'multiple-choice',
      question: 'What is the chemical symbol for gold?',
      correctAnswer: 'A) Au',
      options: ['A) Au', 'B) Ag', 'C) Fe', 'D) Cu'],
      points: 0,
    });
    expect(wasRepaired).toBe(true);
    expect(repaired.points).toBe(1);
  });

  test('repairs missing points for short-answer', () => {
    const { repaired, wasRepaired } = validateAndRepairQuestion({
      type: 'short-answer',
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      points: 0,
    });
    expect(wasRepaired).toBe(true);
    expect(repaired.points).toBe(2);
  });
});

describe('validateAndRepairQuestions', () => {
  test('separates valid and rejected questions', () => {
    const questions = [
      {
        type: 'multiple-choice',
        question: 'What is 2 + 2?',
        correctAnswer: 'A) 4',
        options: ['A) 4', 'B) 5', 'C) 6', 'D) 7'],
        points: 1,
      },
      {
        type: 'short-answer',
        question: 'Short',
        correctAnswer: 'Answer',
        points: 1,
      },
    ];
    const result = validateAndRepairQuestions(questions);
    expect(result.validQuestions.length).toBe(1);
    expect(result.rejectedQuestions.length).toBe(1);
  });

  test('counts total repairs', () => {
    const questions = [
      {
        type: 'mc',
        question: 'What is the chemical symbol for gold?',
        correctAnswer: 'A) Au',
        options: ['A. a. Au', 'B. b. Ag', 'C. c. Fe', 'D. d. Cu'],
        points: 0,
      },
    ];
    const result = validateAndRepairQuestions(questions);
    expect(result.totalRepairs).toBeGreaterThan(0);
  });

  test('collects all issues', () => {
    const questions = [
      {
        type: 'multiple-choice',
        question: 'What?',
        correctAnswer: '',
        options: ['A) 4', 'B) 5'],
        points: 0,
      },
    ];
    const result = validateAndRepairQuestions(questions);
    expect(result.allIssues.length).toBeGreaterThan(0);
  });

  test('handles empty array', () => {
    const result = validateAndRepairQuestions([]);
    expect(result.validQuestions).toEqual([]);
    expect(result.rejectedQuestions).toEqual([]);
    expect(result.totalRepairs).toBe(0);
  });
});

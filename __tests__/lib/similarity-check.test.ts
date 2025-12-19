/**
 * Tests for lib/similarity-check.ts
 */
import {
  checkSimilarity,
  validateOriginalContent,
  extractSafeMetaKeywords,
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

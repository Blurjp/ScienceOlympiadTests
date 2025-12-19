/**
 * Tests for lib/utils.ts
 */
import { cn, formatTime, calculateScore, getDifficultyColor, generateId } from '@/lib/utils';

describe('cn (classNames utility)', () => {
  test('combines multiple class names', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  test('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  test('handles false conditionals', () => {
    const isActive = false;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base');
  });

  test('merges tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  test('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'active');
    expect(result).toBe('base active');
  });

  test('handles empty string', () => {
    const result = cn('base', '', 'active');
    expect(result).toBe('base active');
  });

  test('handles arrays of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  test('handles object syntax', () => {
    const result = cn({ 'active': true, 'disabled': false });
    expect(result).toBe('active');
  });
});

describe('formatTime', () => {
  test('formats seconds only', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  test('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05');
  });

  test('formats hours, minutes, and seconds', () => {
    expect(formatTime(3665)).toBe('1:01:05');
  });

  test('handles zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  test('pads single digit seconds', () => {
    expect(formatTime(61)).toBe('1:01');
  });

  test('pads single digit minutes when hours present', () => {
    expect(formatTime(3601)).toBe('1:00:01');
  });

  test('handles exactly one hour', () => {
    expect(formatTime(3600)).toBe('1:00:00');
  });

  test('handles exactly one minute', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  test('handles large values', () => {
    expect(formatTime(36000)).toBe('10:00:00');
  });

  test('handles 59 seconds', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  test('handles 59 minutes 59 seconds', () => {
    expect(formatTime(3599)).toBe('59:59');
  });
});

describe('calculateScore', () => {
  const questions = [
    { id: '1', correctAnswer: 'A', points: 1 },
    { id: '2', correctAnswer: 'B', points: 2 },
    { id: '3', correctAnswer: 'C', points: 3 },
  ];

  test('calculates perfect score', () => {
    const answers = [
      { questionId: '1', answer: 'A' },
      { questionId: '2', answer: 'B' },
      { questionId: '3', answer: 'C' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(6);
    expect(result.correctAnswers).toBe(3);
    expect(result.totalPoints).toBe(6);
  });

  test('calculates partial score', () => {
    const answers = [
      { questionId: '1', answer: 'A' },
      { questionId: '2', answer: 'X' },
      { questionId: '3', answer: 'C' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(4);
    expect(result.correctAnswers).toBe(2);
    expect(result.totalPoints).toBe(6);
  });

  test('calculates zero score', () => {
    const answers = [
      { questionId: '1', answer: 'X' },
      { questionId: '2', answer: 'X' },
      { questionId: '3', answer: 'X' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
    expect(result.totalPoints).toBe(6);
  });

  test('handles case-insensitive matching', () => {
    const answers = [
      { questionId: '1', answer: 'a' },
      { questionId: '2', answer: 'b' },
      { questionId: '3', answer: 'c' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(6);
    expect(result.correctAnswers).toBe(3);
  });

  test('handles whitespace in answers', () => {
    const answers = [
      { questionId: '1', answer: ' A ' },
      { questionId: '2', answer: ' B ' },
      { questionId: '3', answer: ' C ' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(6);
    expect(result.correctAnswers).toBe(3);
  });

  test('handles empty answers array', () => {
    const result = calculateScore([], questions);
    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
    expect(result.totalPoints).toBe(6);
  });

  test('handles non-existent question IDs', () => {
    const answers = [
      { questionId: '999', answer: 'A' },
    ];
    const result = calculateScore(answers, questions);
    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });

  test('handles empty questions array', () => {
    const answers = [
      { questionId: '1', answer: 'A' },
    ];
    const result = calculateScore(answers, []);
    expect(result.score).toBe(0);
    expect(result.totalPoints).toBe(0);
  });
});

describe('getDifficultyColor', () => {
  describe('competition levels', () => {
    test('returns green for Invitational', () => {
      const result = getDifficultyColor('Invitational');
      expect(result).toContain('green');
    });

    test('returns blue for Regional', () => {
      const result = getDifficultyColor('Regional');
      expect(result).toContain('blue');
    });

    test('returns yellow for State', () => {
      const result = getDifficultyColor('State');
      expect(result).toContain('yellow');
    });

    test('returns red for National', () => {
      const result = getDifficultyColor('National');
      expect(result).toContain('red');
    });
  });

  describe('legacy levels', () => {
    test('returns green for Easy', () => {
      const result = getDifficultyColor('Easy');
      expect(result).toContain('green');
    });

    test('returns yellow for Medium', () => {
      const result = getDifficultyColor('Medium');
      expect(result).toContain('yellow');
    });

    test('returns red for Hard', () => {
      const result = getDifficultyColor('Hard');
      expect(result).toContain('red');
    });
  });

  test('returns gray for unknown difficulty', () => {
    const result = getDifficultyColor('Unknown');
    expect(result).toContain('gray');
  });

  test('returns gray for empty string', () => {
    const result = getDifficultyColor('');
    expect(result).toContain('gray');
  });

  test('returns proper CSS classes', () => {
    const result = getDifficultyColor('Invitational');
    expect(result).toMatch(/bg-\w+-\d+/);
    expect(result).toMatch(/text-\w+-\d+/);
    expect(result).toMatch(/border-\w+-\d+/);
  });
});

describe('generateId', () => {
  test('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  test('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  test('contains timestamp component', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();

    const timestamp = parseInt(id.split('-')[0]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  test('contains random component', () => {
    const id = generateId();
    const parts = id.split('-');
    expect(parts.length).toBe(2);
    expect(parts[1].length).toBe(9);
  });

  test('generates many unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

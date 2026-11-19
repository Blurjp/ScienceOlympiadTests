/**
 * Tests for lib/test-pdf.ts — Pro PDF export rendering.
 * Verifies structure, pagination, content, sanitization, and the answer key.
 */
import { PDFDocument } from 'pdf-lib';
import { extractText } from 'unpdf';
import {
  generateTestPdf,
  buildPdfFilename,
  sanitizeForPdf,
  wrapText,
} from '@/lib/test-pdf';
import type { Test } from '@/lib/types';

function makeTest(overrides: Partial<Test> = {}): Test {
  return {
    id: 'test-1',
    year: 2026,
    title: 'Astronomy: Stellar Evolution',
    description: 'Practice test covering stellar life cycles.',
    difficulty: 'Regional',
    totalTime: 30 * 60,
    totalPoints: 10,
    topic: 'Astronomy',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the approximate mass of the Sun?',
        options: ['1.989 x 10^30 kg', '5.97 x 10^24 kg', '1.989 x 10^27 kg', '3.3 x 10^23 kg'],
        correctAnswer: '1.989 x 10^30 kg',
        points: 2,
        category: 'Stellar',
      },
      {
        id: 'q2',
        type: 'short-answer',
        question: 'Name the process by which stars generate energy.',
        correctAnswer: 'Nuclear fusion',
        points: 3,
        category: 'Stellar',
      },
    ],
    ...overrides,
  };
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const result = await extractText(bytes, { mergePages: true });
  return result.text;
}

describe('generateTestPdf', () => {
  test('produces a valid, non-empty PDF', async () => {
    const bytes = await generateTestPdf(makeTest());

    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(bytes.slice(0, 5)).toString('utf-8')).toBe('%PDF-');

    // Re-parses cleanly with pdf-lib.
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  test('renders the header block and question content', async () => {
    const text = await pdfText(await generateTestPdf(makeTest()));

    expect(text).toContain('Astronomy: Stellar Evolution');
    expect(text).toContain('Astronomy');
    expect(text).toContain('Regional');
    expect(text).toContain('2 questions');
    expect(text).toContain('What is the approximate mass of the Sun?');
    expect(text).toContain('A) 1.989 x 10^30 kg');
    expect(text).toContain('D) 3.3 x 10^23 kg');
    expect(text).toContain('Name the process by which stars generate energy.');
    expect(text).toContain('Name ______________________________');
  });

  test('includes the answer key by default and hides it on request', async () => {
    const withKey = await pdfText(await generateTestPdf(makeTest()));
    expect(withKey).toContain('Answer Key');
    expect(withKey).toContain('Nuclear fusion');

    const withoutKey = await pdfText(
      await generateTestPdf(makeTest(), { includeAnswerKey: false })
    );
    expect(withoutKey).not.toContain('Answer Key');
    expect(withoutKey).not.toContain('Nuclear fusion');
  });

  test('answerKeyOnly renders a standalone answer document without question text', async () => {
    const bytes = await generateTestPdf(makeTest(), { answerKeyOnly: true });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);

    const text = await pdfText(bytes);
    expect(text).toContain('Astronomy: Stellar Evolution');
    expect(text).toContain('Answer Key');
    expect(text).toContain('Nuclear fusion');
    expect(text).toContain('1.989 x 10^30 kg');
    // Question text and the student name/score row belong to the questions file.
    expect(text).not.toContain('approximate mass of the Sun');
    expect(text).not.toContain('Name ____');
  });

  test('paginates long tests across multiple pages', async () => {
    const questions = Array.from({ length: 60 }, (_, i) => ({
      id: `q${i}`,
      type: 'short-answer' as const,
      question: `Question number ${i + 1}: ${'long prompt text '.repeat(12)}`,
      correctAnswer: `Answer ${i + 1}`,
      points: 1,
      category: 'General',
    }));
    const bytes = await generateTestPdf(makeTest({ questions }));

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(3);

    const text = await pdfText(bytes);
    expect(text).toContain('Question number 60');
    expect(text).toContain('Answer 60');
  });

  test('sanitizes Unicode that WinAnsi fonts cannot encode', async () => {
    const test = makeTest({
      title: 'Weird “quotes” and — dashes — plus emoji 🚀',
      questions: [
        {
          id: 'q1',
          type: 'short-answer' as const,
          question: 'Curly ’quotes’ and émojis 🌟 and CJK 光',
          correctAnswer: '→ fusion ≤ 10',
          points: 1,
          category: 'x',
        },
      ],
    });

    const bytes = await generateTestPdf(test); // must not throw
    const text = await pdfText(bytes);
    expect(text).toContain('Curly');
    expect(text).toContain('quotes');
    expect(text).not.toContain('🚀');
    expect(text).toContain('-> fusion <= 10');
  });

  test('renders a placeholder for a test with no questions', async () => {
    const bytes = await generateTestPdf(makeTest({ questions: [] }));
    const text = await pdfText(bytes);

    expect(text).toContain('This test has no questions.');
  });

  test('caps rendered multiple-choice options', async () => {
    const test = makeTest({
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice' as const,
          question: 'Too many options?',
          options: Array.from({ length: 15 }, (_, i) => `Option ${i + 1}`),
          correctAnswer: 'Option 1',
          points: 1,
          category: 'x',
        },
      ],
    });

    const text = await pdfText(await generateTestPdf(test));
    expect(text).toContain('J) Option 10');
    expect(text).not.toContain('Option 11');
  });
});

describe('buildPdfFilename', () => {
  test('builds a safe filename from a title', () => {
    expect(buildPdfFilename('Astronomy: 2026 Test!')).toBe('Astronomy_2026_Test.pdf');
  });

  test('appends a suffix for the paired export files', () => {
    expect(buildPdfFilename('Astronomy: 2026 Test!', 'Questions')).toBe(
      'Astronomy_2026_Test_Questions.pdf'
    );
    expect(buildPdfFilename('Astronomy Practice', 'Answer_Key')).toBe(
      'Astronomy_Practice_Answer_Key.pdf'
    );
  });

  test('falls back to "test" for empty or unsafe titles', () => {
    expect(buildPdfFilename('')).toBe('test.pdf');
    expect(buildPdfFilename('!!! ???')).toBe('test.pdf');
    expect(buildPdfFilename(undefined)).toBe('test.pdf');
  });

  test('truncates very long titles', () => {
    expect(buildPdfFilename('x'.repeat(200)).length).toBeLessThanOrEqual(84);
  });
});

describe('sanitizeForPdf', () => {
  test('maps common Unicode punctuation to ASCII', () => {
    expect(sanitizeForPdf('“quoted” — dash…')).toBe('"quoted" - dash...');
  });

  test('drops characters outside printable ASCII', () => {
    expect(sanitizeForPdf('a\u0000b\u007Fc')).toBe('abc');
  });

  test('returns empty string for non-string input', () => {
    expect(sanitizeForPdf(undefined)).toBe('');
    expect(sanitizeForPdf(42)).toBe('');
  });
});

describe('wrapText', () => {
  test('splits on whitespace and respects the width limit', () => {
    const font = {
      widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5,
    } as never;

    const lines = wrapText('aaaa bbbb cccc dddd', font, 10, 50);
    // Each line fits in 50 units: 10 chars * 10 size * 0.5 = 50 max
    for (const line of lines) {
      expect(line.length * 10 * 0.5).toBeLessThanOrEqual(50);
    }
    expect(lines.join(' ')).toBe('aaaa bbbb cccc dddd');
  });

  test('hard-splits words wider than the column', () => {
    const font = {
      widthOfTextAtSize: (text: string, size: number) => text.length * size,
    } as never;

    const lines = wrapText('aaaaaaaaaaaa', font, 10, 50);
    expect(lines.length).toBe(3); // 12 chars split into 5+5+2
    expect(lines).toEqual(['aaaaa', 'aaaaa', 'aa']);
  });
});

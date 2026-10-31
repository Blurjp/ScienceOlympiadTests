import {
  buildTestPath,
  buildTestSlug,
  difficultyLabel,
  difficultySlug,
  formatTotalTime,
  isPageEligibleTest,
  parseTestSlug,
  toPublicQuestions,
} from '@/lib/test-pages';
import { CURATED_TEST_IDS, isCuratedTestId } from '@/lib/curated-tests';

describe('test-pages slug grammar', () => {
  // Real production id shape: timestamp + dash + random suffix.
  const id = '1770335271483-6mds2qpu1';

  it('parses a slug whose id itself contains a dash', () => {
    expect(parseTestSlug(`${id}-medium-practice-test`)).toEqual({
      id,
      difficulty: 'medium',
    });
    expect(parseTestSlug(`${id}-easy-practice-test`)).toEqual({
      id,
      difficulty: 'easy',
    });
    expect(parseTestSlug(`${id}-hard-practice-test`)).toEqual({
      id,
      difficulty: 'hard',
    });
  });

  it('parses slugs whose id is a UUID (four internal dashes)', () => {
    const uuid = '0b6d8f5e-4a2c-4f7b-9d31-2c8a51e7f903';
    expect(parseTestSlug(`${uuid}-hard-practice-test`)).toEqual({
      id: uuid,
      difficulty: 'hard',
    });
    // round-trip: build then parse recovers the same id
    expect(parseTestSlug(buildTestSlug(uuid, 'Easy'))?.id).toBe(uuid);
  });

  it('drives the 301: a non-canonical slug rebuilds to a different one', () => {
    // The page component compares the requested slug against
    // buildTestSlug(id, difficulty) and permanentRedirects on mismatch;
    // these are the exact values it compares.
    const id = '0b6d8f5e-4a2c-4f7b-9d31-2c8a51e7f903';
    const requested = `${id}-easy-practice-test`; // wrong difficulty
    const canonical = buildTestSlug(id, 'Hard');
    expect(requested).not.toBe(canonical);
    // and the canonical one matches itself (no redirect)
    expect(buildTestSlug(id, 'Easy')).toBe(requested);
  });

  it('rejects malformed slugs', () => {
    expect(parseTestSlug(`${id}-practice-test`)).toBeNull();
    expect(parseTestSlug(`${id}-regional-practice-test`)).toBeNull();
    expect(parseTestSlug(`${id}-medium-test`)).toBeNull();
    expect(parseTestSlug('practice-test')).toBeNull();
    expect(parseTestSlug('')).toBeNull();
  });

  it('builds canonical paths from event + difficulty + id, never the title', () => {
    expect(buildTestSlug(id, 'Medium')).toBe(`${id}-medium-practice-test`);
    expect(buildTestPath('astronomy', id, 'Medium')).toBe(
      `/tests/astronomy/${id}-medium-practice-test`
    );
  });

  it('maps difficulty values both ways with a safe default', () => {
    expect(difficultySlug('Easy')).toBe('easy');
    expect(difficultySlug('Medium')).toBe('medium');
    expect(difficultySlug('Hard')).toBe('hard');
    expect(difficultySlug('State')).toBe('medium'); // shares Medium in the DB
    expect(difficultyLabel('easy')).toBe('Easy');
    expect(difficultyLabel('nonsense')).toBe('Medium');
  });

  it('formats the timer in minutes', () => {
    expect(formatTotalTime(0)).toBe('1 min');
    expect(formatTotalTime(60)).toBe('1 min');
    expect(formatTotalTime(20 * 60)).toBe('20 min');
  });
});

describe('test-pages eligibility', () => {
  it('allows public AI-generated tests', () => {
    expect(
      isPageEligibleTest({
        title: 'AI Generated: Astronomy Practice Test',
        description: 'This practice test contains 10 questions',
        isPublic: true,
      })
    ).toBe(true);
  });

  it('rejects private tests and flagless summaries that are marked private', () => {
    expect(isPageEligibleTest({ title: 'X', isPublic: false })).toBe(false);
  });

  it('treats a missing isPublic flag as public (summaries come from public-only queries)', () => {
    expect(isPageEligibleTest({ title: 'AI Generated: Botany Practice Test' })).toBe(true);
  });

  it('never gives pages to generate-from-pdf output or third-party imports', () => {
    expect(
      isPageEligibleTest({
        title: 'Original Practice: Astronomy (Invitational-style)',
        isPublic: true,
      })
    ).toBe(false);
    expect(
      isPageEligibleTest({
        title: 'Some test',
        description: 'Parsed from uploaded PDF',
        isPublic: true,
      })
    ).toBe(false);
    expect(
      isPageEligibleTest({
        title: 'Some test',
        description: 'Imported from https://drive.google.com/...',
        isPublic: true,
      })
    ).toBe(false);
  });
});

describe('public question view', () => {
  it('strips correct answers - only stems and options are public', () => {
    const view = toPublicQuestions([
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the mechanical advantage of a lever?',
        options: ['MA = effort arm / load arm', 'MA = load arm / effort arm'],
        correctAnswer: 'MA = effort arm / load arm',
        points: 1,
        category: 'Machines',
      },
    ]);
    expect(view).toHaveLength(1);
    expect(view[0]).toEqual({
      id: 'q1',
      number: 1,
      question: 'What is the mechanical advantage of a lever?',
      options: ['MA = effort arm / load arm', 'MA = load arm / effort arm'],
      points: 1,
      category: 'Machines',
    });
    expect(JSON.stringify(view)).not.toContain('correctAnswer');
  });
});

describe('curated test list', () => {
  it('contains only unique ids', () => {
    expect(new Set(CURATED_TEST_IDS).size).toBe(CURATED_TEST_IDS.length);
  });

  it('answers membership', () => {
    expect(isCuratedTestId(CURATED_TEST_IDS[0])).toBe(true);
    expect(isCuratedTestId('not-a-real-id')).toBe(false);
  });
});

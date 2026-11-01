/**
 * Structural checks for SAMPLE_QUESTION_SETS (the deep question sets on
 * high-traffic event pages). Fact-checking is a human/AI review process -
 * these tests keep the data shape honest so the page always renders.
 */
import { SAMPLE_QUESTIONS, SAMPLE_QUESTION_SETS } from '@/lib/sample-questions';
import { DEFAULT_TOPICS } from '@/lib/default-topics';

describe('sample question sets', () => {
  const setTopics = Object.keys(SAMPLE_QUESTION_SETS);

  test('every set topic is a real event', () => {
    setTopics.forEach((topic) => {
      expect(DEFAULT_TOPICS).toContain(topic);
    });
  });

  describe.each(setTopics)('%s', (topic) => {
    const set = SAMPLE_QUESTION_SETS[topic];

    test('has at least 5 questions', () => {
      expect(set.length).toBeGreaterThanOrEqual(5);
    });

    test('every question has exactly 4 options and its answer among them', () => {
      set.forEach((q) => {
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      });
    });

    test('questions are unique within the set', () => {
      expect(new Set(set.map((q) => q.question)).size).toBe(set.length);
    });

    test('question and explanation are substantive', () => {
      set.forEach((q) => {
        expect(q.question.length).toBeGreaterThan(20);
        expect(q.explanation.length).toBeGreaterThan(30);
      });
    });

    test('leads with the featured question when one exists', () => {
      const featured = SAMPLE_QUESTIONS[topic];
      if (featured) {
        expect(set[0].question).toBe(featured.question);
      }
    });
  });
});

/**
 * Tests for source ID generation and parsing (round-trip)
 * Tests the base64-encoded topic format: src-{base64topic}-{level}
 */
import { generateSourceId, parseSourceId } from '@/lib/database';

describe('Source ID functions', () => {
  describe('generateSourceId', () => {
    test('generates correct format', () => {
      const id = generateSourceId('Anatomy and Physiology', 'Invitational');
      expect(id).toMatch(/^src-.+-invitational$/);
    });

    test('uses lowercase level', () => {
      const id = generateSourceId('Test Topic', 'National');
      expect(id.endsWith('-national')).toBe(true);
    });

    test('encodes topic in base64', () => {
      const id = generateSourceId('Test', 'Regional');
      // 'Test' in base64 is 'VGVzdA==' -> 'VGVzdA' (without padding)
      expect(id).toBe('src-VGVzdA-regional');
    });

    test('strips base64 padding', () => {
      // A topic that would have padding in base64
      const id = generateSourceId('A', 'State');
      // 'A' in base64 is 'QQ==' -> should become 'QQ'
      expect(id).toBe('src-QQ-state');
    });
  });

  describe('parseSourceId', () => {
    test('parses valid source ID', () => {
      const result = parseSourceId('src-VGVzdA-regional');
      expect(result).toEqual({
        topic: 'Test',
        level: 'Regional',
      });
    });

    test('returns null for invalid prefix', () => {
      expect(parseSourceId('invalid-prefix')).toBeNull();
      expect(parseSourceId('scraped-topic-level')).toBeNull();
    });

    test('returns null for too few parts', () => {
      expect(parseSourceId('src-onlyonepart')).toBeNull();
      expect(parseSourceId('src')).toBeNull();
    });

    test('returns null for invalid level', () => {
      expect(parseSourceId('src-VGVzdA-invalidlevel')).toBeNull();
    });

    test('parses empty topic correctly', () => {
      // Empty string encodes to empty base64
      const result = parseSourceId('src--regional');
      expect(result).toEqual({ topic: '', level: 'Regional' });
    });

    test('handles all valid levels', () => {
      const levels = ['invitational', 'regional', 'state', 'national'] as const;
      const expectedLevels = ['Invitational', 'Regional', 'State', 'National'] as const;

      levels.forEach((level, i) => {
        const id = `src-VGVzdA-${level}`;
        const result = parseSourceId(id);
        expect(result?.level).toBe(expectedLevels[i]);
      });
    });
  });

  describe('round-trip', () => {
    const testCases = [
      { topic: 'Anatomy and Physiology', level: 'Invitational' },
      { topic: 'Disease Detectives', level: 'Regional' },
      { topic: 'Dynamic Planet', level: 'State' },
      { topic: 'Fermi Questions', level: 'National' },
      // Edge cases
      { topic: 'Simple', level: 'Invitational' },
      { topic: 'Chemistry Lab', level: 'State' },
      // Special characters that could be problematic
      { topic: 'Test/With/Slashes', level: 'Regional' },
      { topic: 'Test With Spaces', level: 'State' },
      { topic: 'Test (With Parens)', level: 'National' },
      { topic: "Test's Apostrophe", level: 'Invitational' },
    ];

    test.each(testCases)('round-trips "$topic" at $level', ({ topic, level }) => {
      const id = generateSourceId(topic, level);
      const parsed = parseSourceId(id);

      expect(parsed).not.toBeNull();
      expect(parsed?.topic).toBe(topic);
      expect(parsed?.level).toBe(level);
    });

    test('all Science Olympiad topics round-trip correctly', () => {
      const topics = [
        'Anatomy and Physiology',
        'Astronomy',
        'Chemistry Lab',
        'Codebusters',
        'Disease Detectives',
        'Dynamic Planet',
        'Ecology',
        'Experimental Design',
        'Fermi Questions',
        'Forensics',
        'Fossils',
        'Microbe Mission',
        'Optics',
        'Reach for the Stars',
        'Tower',
        'Wind Power',
        'Write It Do It',
      ];

      const levels = ['Invitational', 'Regional', 'State', 'National'];

      for (const topic of topics) {
        for (const level of levels) {
          const id = generateSourceId(topic, level);
          const parsed = parseSourceId(id);

          expect(parsed).not.toBeNull();
          expect(parsed?.topic).toBe(topic);
          expect(parsed?.level).toBe(level);
        }
      }
    });

    test('preserves exact topic string including case', () => {
      const originalTopic = 'Mixed CASE Topic';
      const id = generateSourceId(originalTopic, 'State');
      const parsed = parseSourceId(id);

      expect(parsed?.topic).toBe(originalTopic);
    });
  });

  describe('base64 handling edge cases', () => {
    test('handles topics with hyphen (hyphen in base64 output)', () => {
      // Topics that produce base64 with characters that look like hyphens
      const topic = 'Test Topic';
      const id = generateSourceId(topic, 'State');
      const parsed = parseSourceId(id);

      expect(parsed?.topic).toBe(topic);
    });

    test('handles empty topic gracefully', () => {
      const id = generateSourceId('', 'State');
      const parsed = parseSourceId(id);

      // Empty string is valid base64
      expect(parsed?.topic).toBe('');
    });

    test('handles unicode characters', () => {
      const topic = 'Test with émojis 🧬';
      const id = generateSourceId(topic, 'National');
      const parsed = parseSourceId(id);

      expect(parsed?.topic).toBe(topic);
    });
  });
});

/**
 * Tests for lib/pdf-sources.ts
 */
import {
  CURATED_PDF_SOURCES,
  PDFSource,
  getSourcesByTopic,
  getSourcesByLevel,
  getSourceById,
  getAvailableTopics,
} from '@/lib/pdf-sources';

describe('CURATED_PDF_SOURCES', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(CURATED_PDF_SOURCES)).toBe(true);
    expect(CURATED_PDF_SOURCES.length).toBeGreaterThan(0);
  });

  test('all sources have required fields', () => {
    CURATED_PDF_SOURCES.forEach((source, index) => {
      expect(source.id).toBeTruthy();
      expect(source.name).toBeTruthy();
      expect(source.url).toBeTruthy();
      expect(source.topic).toBeTruthy();
      expect(source.year).toBeDefined();
      expect(source.level).toBeTruthy();
      expect(source.source).toBeTruthy();
      expect(source.description).toBeTruthy();
    });
  });

  test('all sources have unique IDs', () => {
    const ids = CURATED_PDF_SOURCES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  test('all sources have valid URLs', () => {
    CURATED_PDF_SOURCES.forEach(source => {
      expect(source.url).toMatch(/^https?:\/\//);
    });
  });

  test('all sources have valid levels', () => {
    const validLevels = ['Invitational', 'Regional', 'State', 'National'];
    CURATED_PDF_SOURCES.forEach(source => {
      expect(validLevels).toContain(source.level);
    });
  });

  test('all sources have reasonable years', () => {
    CURATED_PDF_SOURCES.forEach(source => {
      expect(source.year).toBeGreaterThan(2000);
      expect(source.year).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    });
  });
});

describe('getSourcesByTopic', () => {
  test('returns sources for existing topic', () => {
    const anatomySources = getSourcesByTopic('Anatomy and Physiology');
    expect(Array.isArray(anatomySources)).toBe(true);
    anatomySources.forEach(source => {
      expect(source.topic).toBe('Anatomy and Physiology');
    });
  });

  test('returns empty array for non-existent topic', () => {
    const sources = getSourcesByTopic('Non-existent Topic');
    expect(sources).toEqual([]);
  });

  test('returns sources for Astronomy topic', () => {
    const sources = getSourcesByTopic('Astronomy');
    expect(sources.length).toBeGreaterThan(0);
    sources.forEach(source => {
      expect(source.topic).toBe('Astronomy');
    });
  });

  test('returns sources for Chemistry Lab topic', () => {
    const sources = getSourcesByTopic('Chemistry Lab');
    expect(sources.length).toBeGreaterThan(0);
  });

  test('is case-sensitive', () => {
    const upperCase = getSourcesByTopic('ANATOMY AND PHYSIOLOGY');
    const properCase = getSourcesByTopic('Anatomy and Physiology');
    expect(upperCase.length).toBe(0);
    expect(properCase.length).toBeGreaterThan(0);
  });

  test('returns correct PDFSource objects', () => {
    const sources = getSourcesByTopic('Fossils');
    if (sources.length > 0) {
      const source = sources[0];
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('topic');
      expect(source).toHaveProperty('year');
      expect(source).toHaveProperty('level');
      expect(source).toHaveProperty('source');
      expect(source).toHaveProperty('description');
    }
  });
});

describe('getSourcesByLevel', () => {
  test('returns sources for Invitational level', () => {
    const sources = getSourcesByLevel('Invitational');
    expect(Array.isArray(sources)).toBe(true);
    sources.forEach(source => {
      expect(source.level).toBe('Invitational');
    });
  });

  test('returns sources for Regional level', () => {
    const sources = getSourcesByLevel('Regional');
    expect(Array.isArray(sources)).toBe(true);
    sources.forEach(source => {
      expect(source.level).toBe('Regional');
    });
  });

  test('returns sources for State level', () => {
    const sources = getSourcesByLevel('State');
    expect(Array.isArray(sources)).toBe(true);
    sources.forEach(source => {
      expect(source.level).toBe('State');
    });
  });

  test('returns sources for National level', () => {
    const sources = getSourcesByLevel('National');
    expect(Array.isArray(sources)).toBe(true);
    sources.forEach(source => {
      expect(source.level).toBe('National');
    });
  });

  test('Invitational sources exist', () => {
    const sources = getSourcesByLevel('Invitational');
    expect(sources.length).toBeGreaterThan(0);
  });
});

describe('getSourceById', () => {
  test('returns source for existing ID', () => {
    const firstSource = CURATED_PDF_SOURCES[0];
    const found = getSourceById(firstSource.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstSource.id);
    expect(found?.name).toBe(firstSource.name);
  });

  test('returns undefined for non-existent ID', () => {
    const found = getSourceById('non-existent-id-12345');
    expect(found).toBeUndefined();
  });

  test('returns correct full source object', () => {
    const firstSource = CURATED_PDF_SOURCES[0];
    const found = getSourceById(firstSource.id);
    expect(found).toEqual(firstSource);
  });

  test('handles empty string ID', () => {
    const found = getSourceById('');
    expect(found).toBeUndefined();
  });

  test('is case-sensitive', () => {
    const firstSource = CURATED_PDF_SOURCES[0];
    const found = getSourceById(firstSource.id.toUpperCase());
    if (firstSource.id !== firstSource.id.toUpperCase()) {
      expect(found).toBeUndefined();
    }
  });
});

describe('getAvailableTopics', () => {
  test('returns array of strings', () => {
    const topics = getAvailableTopics();
    expect(Array.isArray(topics)).toBe(true);
    topics.forEach(topic => {
      expect(typeof topic).toBe('string');
    });
  });

  test('returns unique topics', () => {
    const topics = getAvailableTopics();
    const uniqueTopics = new Set(topics);
    expect(topics.length).toBe(uniqueTopics.size);
  });

  test('includes common Science Olympiad topics', () => {
    const topics = getAvailableTopics();
    // Check for some expected topics based on the CURATED_PDF_SOURCES
    const expectedTopics = ['Anatomy and Physiology', 'Astronomy'];
    expectedTopics.forEach(expected => {
      expect(topics).toContain(expected);
    });
  });

  test('returns non-empty array', () => {
    const topics = getAvailableTopics();
    expect(topics.length).toBeGreaterThan(0);
  });

  test('all returned topics have at least one source', () => {
    const topics = getAvailableTopics();
    topics.forEach(topic => {
      const sources = getSourcesByTopic(topic);
      expect(sources.length).toBeGreaterThan(0);
    });
  });
});

describe('PDFSource interface', () => {
  test('sources conform to PDFSource interface', () => {
    CURATED_PDF_SOURCES.forEach(source => {
      // Type checking via assertions
      const typed: PDFSource = source;
      expect(typeof typed.id).toBe('string');
      expect(typeof typed.name).toBe('string');
      expect(typeof typed.url).toBe('string');
      expect(typeof typed.topic).toBe('string');
      expect(typeof typed.year).toBe('number');
      expect(['Invitational', 'Regional', 'State', 'National']).toContain(typed.level);
      expect(typeof typed.source).toBe('string');
      expect(typeof typed.description).toBe('string');
    });
  });
});

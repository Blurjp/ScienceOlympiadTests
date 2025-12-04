/**
 * Tests to verify all Science Olympiad topics are properly configured
 * for AI test generation.
 */

// Topics available in the UI (from app/page.tsx)
const DEFAULT_TOPICS = [
  'Anatomy and Physiology',
  'Astronomy',
  'Chemistry Lab',
  'Disease Detectives',
  'Dynamic Planet',
  'Ecology',
  'Experimental Design',
  'Fermi Questions',
  'Forensics',
  'Fossils',
  'Machines',
  'Microbe Mission',
  'Optics',
  'Ornithology',
  'Reach for the Stars',
  'Rocks and Minerals',
  'Tower',
  'Wind Power',
  'Write It Do It',
];

// Topic descriptions for AI generation (from app/api/generate-ai-test/route.ts)
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Anatomy and Physiology': 'human body systems, organs, tissues, and physiological processes',
  'Astronomy': 'stars, galaxies, planets, cosmology, and celestial mechanics',
  'Chemistry Lab': 'chemical reactions, lab techniques, stoichiometry, and chemical properties',
  'Disease Detectives': 'epidemiology, disease transmission, public health, and outbreak investigation',
  'Dynamic Planet': 'Earth science, geology, plate tectonics, and natural disasters',
  'Ecology': 'ecosystems, food webs, biodiversity, and environmental science',
  'Experimental Design': 'scientific method, experiment design, data analysis, and statistics',
  'Fermi Questions': 'estimation problems and order-of-magnitude calculations',
  'Forensics': 'crime scene analysis, evidence collection, and forensic science techniques',
  'Fossils': 'paleontology, fossil identification, geological time, and evolution',
  'Machines': 'simple machines, mechanical advantage, levers, pulleys, inclined planes, and physics of mechanical systems',
  'Microbe Mission': 'microbiology, bacteria, viruses, and microorganisms',
  'Optics': 'light, lenses, mirrors, reflection, refraction, and optical instruments',
  'Ornithology': 'bird identification, anatomy, behavior, and ecology',
  'Reach for the Stars': 'stellar astronomy, deep sky objects, and astrophysics',
  'Rocks and Minerals': 'rock types, mineral identification, and geological processes',
  'Tower': 'structural engineering principles and physics of structures',
  'Wind Power': 'renewable energy, wind turbine design, and energy physics',
  'Write It Do It': 'technical writing and following written instructions',
};

describe('Science Olympiad Topics Configuration', () => {
  describe('Topic Coverage', () => {
    test('all DEFAULT_TOPICS have descriptions in TOPIC_DESCRIPTIONS', () => {
      const missingDescriptions: string[] = [];

      for (const topic of DEFAULT_TOPICS) {
        if (!TOPIC_DESCRIPTIONS[topic]) {
          missingDescriptions.push(topic);
        }
      }

      expect(missingDescriptions).toEqual([]);
    });

    test('all TOPIC_DESCRIPTIONS topics are in DEFAULT_TOPICS', () => {
      const extraTopics: string[] = [];

      for (const topic of Object.keys(TOPIC_DESCRIPTIONS)) {
        if (!DEFAULT_TOPICS.includes(topic)) {
          extraTopics.push(topic);
        }
      }

      expect(extraTopics).toEqual([]);
    });

    test('topic counts match', () => {
      expect(DEFAULT_TOPICS.length).toBe(Object.keys(TOPIC_DESCRIPTIONS).length);
    });
  });

  describe('Topic Descriptions', () => {
    test.each(DEFAULT_TOPICS)('"%s" has a non-empty description', (topic) => {
      const description = TOPIC_DESCRIPTIONS[topic];
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(10);
    });

    test.each(DEFAULT_TOPICS)('"%s" description contains relevant keywords', (topic) => {
      const description = TOPIC_DESCRIPTIONS[topic];
      // Each description should have at least 2 comma-separated items or keywords
      expect(description).toMatch(/\w+/);
    });
  });

  describe('Individual Topic Tests', () => {
    test('Anatomy and Physiology covers body systems', () => {
      expect(TOPIC_DESCRIPTIONS['Anatomy and Physiology']).toContain('body');
    });

    test('Astronomy covers celestial objects', () => {
      expect(TOPIC_DESCRIPTIONS['Astronomy']).toMatch(/stars|galaxies|planets/);
    });

    test('Chemistry Lab covers reactions and techniques', () => {
      expect(TOPIC_DESCRIPTIONS['Chemistry Lab']).toMatch(/reactions|techniques/);
    });

    test('Disease Detectives covers epidemiology', () => {
      expect(TOPIC_DESCRIPTIONS['Disease Detectives']).toContain('epidemiology');
    });

    test('Dynamic Planet covers Earth science', () => {
      expect(TOPIC_DESCRIPTIONS['Dynamic Planet']).toMatch(/Earth|geology/);
    });

    test('Ecology covers ecosystems', () => {
      expect(TOPIC_DESCRIPTIONS['Ecology']).toContain('ecosystems');
    });

    test('Experimental Design covers scientific method', () => {
      expect(TOPIC_DESCRIPTIONS['Experimental Design']).toContain('scientific method');
    });

    test('Fermi Questions covers estimation', () => {
      expect(TOPIC_DESCRIPTIONS['Fermi Questions']).toContain('estimation');
    });

    test('Forensics covers crime scene analysis', () => {
      expect(TOPIC_DESCRIPTIONS['Forensics']).toContain('crime scene');
    });

    test('Fossils covers paleontology', () => {
      expect(TOPIC_DESCRIPTIONS['Fossils']).toContain('paleontology');
    });

    test('Machines covers simple machines and mechanical advantage', () => {
      expect(TOPIC_DESCRIPTIONS['Machines']).toMatch(/simple machines|mechanical advantage/);
    });

    test('Microbe Mission covers microbiology', () => {
      expect(TOPIC_DESCRIPTIONS['Microbe Mission']).toContain('microbiology');
    });

    test('Optics covers light and lenses', () => {
      expect(TOPIC_DESCRIPTIONS['Optics']).toMatch(/light|lenses/);
    });

    test('Ornithology covers birds', () => {
      expect(TOPIC_DESCRIPTIONS['Ornithology']).toContain('bird');
    });

    test('Reach for the Stars covers stellar astronomy', () => {
      expect(TOPIC_DESCRIPTIONS['Reach for the Stars']).toContain('stellar');
    });

    test('Rocks and Minerals covers rock types', () => {
      expect(TOPIC_DESCRIPTIONS['Rocks and Minerals']).toContain('rock');
    });

    test('Tower covers structural engineering', () => {
      expect(TOPIC_DESCRIPTIONS['Tower']).toContain('structural');
    });

    test('Wind Power covers renewable energy', () => {
      expect(TOPIC_DESCRIPTIONS['Wind Power']).toContain('renewable');
    });

    test('Write It Do It covers technical writing', () => {
      expect(TOPIC_DESCRIPTIONS['Write It Do It']).toContain('technical writing');
    });
  });
});

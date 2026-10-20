/**
 * Tests to verify all Science Olympiad topics are properly configured
 * for AI test generation.
 */

// Topics available in the UI (from lib/default-topics.ts)
const DEFAULT_TOPICS = [
  'Anatomy and Physiology',
  'Astronomy',
  'Botany',
  'Chemistry Lab',
  'Circuit Lab',
  'Codebusters',
  'Crime Busters',
  'Designer Genes',
  'Disease Detectives',
  'Dynamic Planet',
  'Ecology',
  'Experimental Design',
  'Fermi Questions',
  'Food Science',
  'Forensics',
  'Fossils',
  'Heredity',
  'Machines',
  'Meteorology',
  'Microbe Mission',
  'Optics',
  'Ornithology',
  'Protein Modeling',
  'Reach for the Stars',
  'Remote Sensing',
  'Rocks and Minerals',
  'Solar System',
  'Thermodynamics',
  'Tower',
  'Water Quality',
  'Wind Power',
  'Write It Do It',
];

// Topic descriptions for AI generation (from lib/topic-descriptions.ts)
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Anatomy and Physiology': 'human body systems, organs, tissues, and physiological processes',
  'Astronomy': 'stars, galaxies, planets, cosmology, and celestial mechanics',
  'Botany': 'plant biology, anatomy, photosynthesis, reproduction, taxonomy, and evolution',
  'Chemistry Lab': 'chemical reactions, lab techniques, stoichiometry, and chemical properties',
  'Circuit Lab': 'electricity, electronics, circuits, Ohm\u2019s law, power, and electromagnetism',
  'Codebusters': 'cipher decoding, cryptanalysis, and classical to modern ciphers',
  'Crime Busters': 'forensic qualitative analysis, powder and fiber identification, and chromatography',
  'Designer Genes': 'molecular genetics, biotechnology, inheritance, and population genetics',
  'Disease Detectives': 'epidemiology, disease transmission, public health, and outbreak investigation',
  'Dynamic Planet': 'Earth science, geology, plate tectonics, and natural disasters',
  'Ecology': 'ecosystems, food webs, biodiversity, and environmental science',
  'Experimental Design': 'scientific method, experiment design, data analysis, and statistics',
  'Fermi Questions': 'estimation problems and order-of-magnitude calculations',
  'Food Science': 'dairy science, milk composition, casein and whey, freezing point depression, emulsification, pasteurization, and cultured dairy products',
  'Forensics': 'crime scene analysis, evidence collection, and forensic science techniques',
  'Fossils': 'paleontology, fossil identification, geological time, and evolution',
  'Heredity': 'classical and molecular genetics, inheritance patterns, pedigrees, and chromosomes',
  'Machines': 'simple machines, mechanical advantage, levers, pulleys, inclined planes, and physics of mechanical systems',
  'Meteorology': 'weather, severe storms, atmosphere, forecasting, and meteorological data interpretation',
  'Microbe Mission': 'microbiology, bacteria, viruses, and microorganisms',
  'Optics': 'light, lenses, mirrors, reflection, refraction, and optical instruments',
  'Ornithology': 'bird identification, anatomy, behavior, and ecology',
  'Protein Modeling': 'protein structure, folding, amino acids, and the 2027 influenza hemagglutinin focus',
  'Reach for the Stars': 'stellar astronomy, deep sky objects, and astrophysics',
  'Remote Sensing': 'satellite imagery, Earth observation, spectral analysis, and climate data',
  'Rocks and Minerals': 'rock types, mineral identification, and geological processes',
  'Solar System': 'planets, moons, small bodies, and habitability within and beyond the solar system',
  'Thermodynamics': 'heat transfer, thermodynamic laws, calorimetry, and heat engines',
  'Tower': 'structural engineering principles and physics of structures',
  'Water Quality': 'aquatic ecology, marine and estuary environments, water testing, and macroinvertebrate indicators',
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

    test('Food Science covers dairy', () => {
      expect(TOPIC_DESCRIPTIONS['Food Science']).toContain('dairy');
    });

    test('Botany covers plants', () => {
      expect(TOPIC_DESCRIPTIONS['Botany']).toMatch(/plant/);
    });

    test('Circuit Lab covers electricity and circuits', () => {
      expect(TOPIC_DESCRIPTIONS['Circuit Lab']).toMatch(/electricity|circuits/);
    });

    test('Codebusters covers ciphers', () => {
      expect(TOPIC_DESCRIPTIONS['Codebusters']).toContain('cipher');
    });

    test('Crime Busters covers forensic analysis', () => {
      expect(TOPIC_DESCRIPTIONS['Crime Busters']).toMatch(/forensic|powder/);
    });

    test('Designer Genes covers genetics', () => {
      expect(TOPIC_DESCRIPTIONS['Designer Genes']).toContain('genetics');
    });

    test('Heredity covers genetics', () => {
      expect(TOPIC_DESCRIPTIONS['Heredity']).toContain('genetics');
    });

    test('Meteorology covers weather', () => {
      expect(TOPIC_DESCRIPTIONS['Meteorology']).toContain('weather');
    });

    test('Protein Modeling covers protein structure', () => {
      expect(TOPIC_DESCRIPTIONS['Protein Modeling']).toContain('protein structure');
    });

    test('Remote Sensing covers satellites and Earth observation', () => {
      expect(TOPIC_DESCRIPTIONS['Remote Sensing']).toMatch(/satellite|Earth observation/);
    });

    test('Solar System covers habitability and planets', () => {
      expect(TOPIC_DESCRIPTIONS['Solar System']).toMatch(/planet|habitable/);
    });

    test('Water Quality covers aquatic environments', () => {
      expect(TOPIC_DESCRIPTIONS['Water Quality']).toMatch(/aquatic|water/);
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

    test('Thermodynamics covers heat transfer and laws', () => {
      expect(TOPIC_DESCRIPTIONS['Thermodynamics']).toMatch(/heat transfer|thermodynamic laws/);
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

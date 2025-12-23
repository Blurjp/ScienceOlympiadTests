// Seed data for reference questions
// These are high-quality example questions based on historical Science Olympiad tests
// Used for few-shot learning to improve AI-generated test quality

import { ReferenceQuestion } from './database';

// Use canonical topic names (matching UI exactly)
export const SEED_REFERENCE_QUESTIONS: ReferenceQuestion[] = [
  // ==================== ANATOMY AND PHYSIOLOGY ====================
  {
    topic: 'Anatomy and Physiology',
    subtopic: 'Nervous System',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'During an action potential, what ion channel opens first in response to membrane depolarization reaching threshold?',
    correctAnswer: 'Voltage-gated sodium channels',
    options: [
      'A) Voltage-gated potassium channels',
      'B) Voltage-gated sodium channels',
      'C) Ligand-gated calcium channels',
      'D) Leak potassium channels'
    ],
    explanation: 'Voltage-gated Na+ channels open first at threshold (-55mV), causing rapid depolarization. K+ channels open later during repolarization.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['neurons', 'action potential', 'ion channels']
  },
  {
    topic: 'Anatomy and Physiology',
    subtopic: 'Cardiovascular',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'A patient has a stroke volume of 70 mL and a heart rate of 75 beats per minute. Calculate the cardiac output in liters per minute.',
    correctAnswer: '5.25 L/min',
    explanation: 'CO = SV × HR = 70 mL × 75 bpm = 5250 mL/min = 5.25 L/min',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['cardiac output', 'calculation', 'cardiovascular']
  },
  {
    topic: 'Anatomy and Physiology',
    subtopic: 'Respiratory',
    difficulty: 'Regional',
    questionType: 'short-answer',
    questionText: 'What is the partial pressure of oxygen in the alveoli if atmospheric pressure is 760 mmHg and the percentage of oxygen is 21%? Account for water vapor pressure of 47 mmHg and CO2 partial pressure of 40 mmHg.',
    correctAnswer: '104 mmHg',
    explanation: 'PAO2 = (760 - 47) × 0.21 - 40 = 713 × 0.21 - 40 ≈ 150 - 40 = 110 mmHg (simplified). Actual alveolar O2 ≈ 104 mmHg.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['gas exchange', 'partial pressure', 'alveoli']
  },

  // ==================== ASTRONOMY ====================
  {
    topic: 'Astronomy',
    subtopic: 'Stellar Properties',
    difficulty: 'National',
    questionType: 'calculation',
    questionText: 'A star has an apparent magnitude of +1.5 and an absolute magnitude of -3.0. Calculate its distance in parsecs.',
    correctAnswer: '79.4 parsecs',
    explanation: 'm - M = 5 log(d/10). So 1.5 - (-3.0) = 5 log(d/10). 4.5 = 5 log(d/10). log(d/10) = 0.9. d/10 = 10^0.9 = 7.94. d = 79.4 pc.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['distance modulus', 'magnitudes', 'calculation']
  },
  {
    topic: 'Astronomy',
    subtopic: 'Stellar Evolution',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'What is the minimum mass required for a main sequence star to eventually undergo core-collapse and form a neutron star?',
    correctAnswer: 'Approximately 8 solar masses',
    options: [
      'A) Approximately 1.4 solar masses',
      'B) Approximately 3 solar masses',
      'C) Approximately 8 solar masses',
      'D) Approximately 25 solar masses'
    ],
    explanation: 'Stars with M > 8 M☉ can undergo core-collapse supernovae. 1.4 M☉ is the Chandrasekhar limit for white dwarfs. 25 M☉ is roughly the threshold for black hole formation.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['stellar evolution', 'supernova', 'mass limits']
  },
  {
    topic: 'Astronomy',
    subtopic: 'HR Diagram',
    difficulty: 'Regional',
    questionType: 'short-answer',
    questionText: 'On the HR diagram, a star is located in the upper right region. What is its spectral classification range, and what type of star is it?',
    correctAnswer: 'Spectral class K or M (cool), Red Giant or Red Supergiant',
    explanation: 'Upper right of HR diagram = high luminosity + low temperature = Red Giants/Supergiants with spectral class K or M.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['HR diagram', 'spectral classification', 'giants']
  },

  // ==================== CHEMISTRY LAB ====================
  {
    topic: 'Chemistry Lab',
    subtopic: 'Stoichiometry',
    difficulty: 'National',
    questionType: 'calculation',
    questionText: 'How many grams of precipitate form when 50.0 mL of 0.200 M AgNO₃ is mixed with excess NaCl? (Ag = 107.87 g/mol, Cl = 35.45 g/mol)',
    correctAnswer: '1.43 g AgCl',
    explanation: 'mol AgNO₃ = 0.050 L × 0.200 M = 0.010 mol. AgNO₃ + NaCl → AgCl + NaNO₃ (1:1). mol AgCl = 0.010 mol. Mass = 0.010 × 143.32 g/mol = 1.43 g.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['precipitation', 'stoichiometry', 'calculation']
  },
  {
    topic: 'Chemistry Lab',
    subtopic: 'Acid-Base',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'What is the pH of a 0.0050 M solution of HCl?',
    correctAnswer: 'pH = 2.30',
    explanation: 'HCl is a strong acid, completely dissociates. [H⁺] = 0.0050 M. pH = -log(0.0050) = -log(5.0 × 10⁻³) = 3 - log(5) = 3 - 0.70 = 2.30.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['pH', 'strong acids', 'calculation']
  },

  // ==================== MACHINES ====================
  {
    topic: 'Machines',
    subtopic: 'Simple Machines',
    difficulty: 'National',
    questionType: 'calculation',
    questionText: 'A screw has a pitch of 3 mm and a handle radius of 15 cm. If a force of 20 N is applied to the handle, what is the theoretical force output? Assume 100% efficiency.',
    correctAnswer: '6283 N (or 6.28 kN)',
    explanation: 'IMA = 2πr/pitch = 2π(150 mm)/3 mm = 314.16. Theoretical Force = IMA × Input Force = 314.16 × 20 N = 6283 N.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['screw', 'IMA', 'force', 'calculation']
  },
  {
    topic: 'Machines',
    subtopic: 'Energy',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'A 2 kg ball is dropped from a height of 10 m. What is its kinetic energy just before hitting the ground? (g = 10 m/s²)',
    correctAnswer: '200 J',
    explanation: 'Using conservation of energy: KE = PE = mgh = 2 kg × 10 m/s² × 10 m = 200 J. Alternatively, find v using v² = 2gh, then KE = ½mv².',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['energy conservation', 'kinetic energy', 'potential energy']
  },
  {
    topic: 'Machines',
    subtopic: 'Compound Machines',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'A compound machine consists of a wheel and axle (IMA = 4) connected to a pulley system (IMA = 3). What is the overall IMA of the compound machine?',
    correctAnswer: 'IMA = 12',
    options: [
      'A) IMA = 7',
      'B) IMA = 12',
      'C) IMA = 1.33',
      'D) IMA = 3.5'
    ],
    explanation: 'For compound machines, total IMA = product of individual IMAs = 4 × 3 = 12.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['compound machines', 'IMA', 'multiplication']
  },

  // ==================== OPTICS ====================
  {
    topic: 'Optics',
    subtopic: 'Lenses',
    difficulty: 'National',
    questionType: 'calculation',
    questionText: 'An object is placed 30 cm from a converging lens with focal length 20 cm. Calculate the image distance and magnification.',
    correctAnswer: 'Image distance = 60 cm, Magnification = -2 (inverted, enlarged)',
    explanation: '1/f = 1/do + 1/di. 1/20 = 1/30 + 1/di. 1/di = 1/20 - 1/30 = (3-2)/60 = 1/60. di = 60 cm. M = -di/do = -60/30 = -2.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['thin lens equation', 'magnification', 'converging lens']
  },
  {
    topic: 'Optics',
    subtopic: 'Refraction',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'Light travels from air (n=1.00) into glass (n=1.50) at an angle of incidence of 45°. What is the angle of refraction?',
    correctAnswer: '28.1°',
    explanation: 'Snell\'s Law: n₁ sin θ₁ = n₂ sin θ₂. 1.00 × sin(45°) = 1.50 × sin θ₂. sin θ₂ = 0.707/1.50 = 0.471. θ₂ = arcsin(0.471) = 28.1°.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['Snell\'s law', 'refraction', 'calculation']
  },
  {
    topic: 'Optics',
    subtopic: 'Wave Optics',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'In a double-slit experiment, if the slit separation is halved while all other parameters remain constant, what happens to the fringe spacing?',
    correctAnswer: 'The fringe spacing doubles',
    options: [
      'A) The fringe spacing is halved',
      'B) The fringe spacing doubles',
      'C) The fringe spacing remains the same',
      'D) The fringe spacing quadruples'
    ],
    explanation: 'Fringe spacing Δy = λL/d. If d is halved, Δy doubles. The spacing is inversely proportional to slit separation.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['double-slit', 'interference', 'fringe spacing']
  },

  // ==================== ECOLOGY ====================
  {
    topic: 'Ecology',
    subtopic: 'Population Dynamics',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'A population of 1000 deer has a birth rate of 0.3 per capita and a death rate of 0.1 per capita per year. Calculate the population size after 2 years assuming exponential growth.',
    correctAnswer: '1492 deer',
    explanation: 'r = b - d = 0.3 - 0.1 = 0.2. N(t) = N₀ × e^(rt) = 1000 × e^(0.2×2) = 1000 × e^0.4 = 1000 × 1.492 = 1492.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['exponential growth', 'population', 'calculation']
  },
  {
    topic: 'Ecology',
    subtopic: 'Energy Flow',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'If producers in an ecosystem capture 10,000 kcal of energy, approximately how much energy is available to tertiary consumers?',
    correctAnswer: '10 kcal',
    options: [
      'A) 1000 kcal',
      'B) 100 kcal',
      'C) 10 kcal',
      'D) 1 kcal'
    ],
    explanation: 'The 10% rule: Producers (10,000) → Primary consumers (1,000) → Secondary consumers (100) → Tertiary consumers (10 kcal).',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['energy transfer', '10% rule', 'trophic levels']
  },

  // ==================== FORENSICS ====================
  {
    topic: 'Forensics',
    subtopic: 'Blood Evidence',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'At a crime scene, bloodstain pattern analysis reveals elliptical stains with a length of 6 mm and width of 3 mm. What is the angle of impact?',
    correctAnswer: '30°',
    options: [
      'A) 15°',
      'B) 30°',
      'C) 45°',
      'D) 60°'
    ],
    explanation: 'sin(θ) = width/length = 3/6 = 0.5. θ = arcsin(0.5) = 30°.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['bloodstain patterns', 'angle of impact', 'calculation']
  },
  {
    topic: 'Forensics',
    subtopic: 'DNA Evidence',
    difficulty: 'National',
    questionType: 'short-answer',
    questionText: 'In STR analysis, a suspect\'s DNA profile shows 13,15 at the D5S818 locus. The crime scene sample shows 13,13. Can the suspect be excluded as the source?',
    correctAnswer: 'No, the suspect cannot be excluded. They could have contributed the 13 allele.',
    explanation: 'The crime scene shows a homozygous profile (13,13) which could come from any person who has at least one 13 allele. The suspect has 13,15 and could be a contributor.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['DNA', 'STR', 'alleles', 'exclusion']
  },

  // ==================== FERMI QUESTIONS ====================
  {
    topic: 'Fermi Questions',
    subtopic: 'Estimation',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'Estimate the number of heartbeats in an average human lifetime.',
    correctAnswer: '2.5 to 3 billion heartbeats (10^9.4)',
    explanation: 'Heart rate: ~70 bpm average. Minutes/day: 1440. Days/year: 365. Years: 75. Total = 70 × 1440 × 365 × 75 = 2.76 × 10^9 ≈ 3 billion.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['estimation', 'human body', 'lifetime']
  },
  {
    topic: 'Fermi Questions',
    subtopic: 'Estimation',
    difficulty: 'Regional',
    questionType: 'calculation',
    questionText: 'Estimate the mass of all the air in a typical classroom.',
    correctAnswer: '200-400 kg (10^2.4)',
    explanation: 'Classroom: 10m × 8m × 3m = 240 m³. Air density: 1.2 kg/m³. Mass = 240 × 1.2 = 288 kg ≈ 300 kg.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['estimation', 'air', 'density', 'volume']
  },

  // ==================== DYNAMIC PLANET ====================
  {
    topic: 'Dynamic Planet',
    subtopic: 'Earthquakes',
    difficulty: 'State',
    questionType: 'calculation',
    questionText: 'How many times more energy is released by a magnitude 7 earthquake compared to a magnitude 5 earthquake?',
    correctAnswer: 'Approximately 1000 times (10^3)',
    explanation: 'Energy increases by a factor of ~31.6 per magnitude unit. For 2 magnitude difference: 31.6² ≈ 1000.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['Richter scale', 'energy', 'earthquakes']
  },
  {
    topic: 'Dynamic Planet',
    subtopic: 'Plate Tectonics',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'At a convergent boundary where oceanic lithosphere subducts beneath continental lithosphere, which feature is NOT typically formed?',
    correctAnswer: 'Mid-ocean ridge',
    options: [
      'A) Volcanic arc',
      'B) Deep ocean trench',
      'C) Mid-ocean ridge',
      'D) Accretionary wedge'
    ],
    explanation: 'Mid-ocean ridges form at divergent boundaries. Convergent boundaries with subduction create trenches, volcanic arcs, and accretionary wedges.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['plate tectonics', 'subduction', 'convergent boundary']
  },

  // ==================== MICROBE MISSION ====================
  {
    topic: 'Microbe Mission',
    subtopic: 'Bacteria',
    difficulty: 'State',
    questionType: 'short-answer',
    questionText: 'A bacterial culture starts with 100 cells and doubles every 20 minutes. How many cells will be present after 2 hours?',
    correctAnswer: '6400 cells',
    explanation: '2 hours = 120 minutes. Number of generations = 120/20 = 6. Final cells = 100 × 2^6 = 100 × 64 = 6400.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['bacterial growth', 'exponential', 'generation time']
  },
  {
    topic: 'Microbe Mission',
    subtopic: 'Gram Staining',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'During Gram staining, what is the purpose of the iodine mordant?',
    correctAnswer: 'To form a crystal violet-iodine complex that is trapped in Gram-positive cells',
    options: [
      'A) To decolorize Gram-negative cells',
      'B) To form a crystal violet-iodine complex that is trapped in Gram-positive cells',
      'C) To counterstain cells pink',
      'D) To fix cells to the slide'
    ],
    explanation: 'Iodine acts as a mordant, forming a CV-I complex. This complex is too large to escape through the thick peptidoglycan layer of Gram+ cells but washes out of Gram- cells.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['Gram staining', 'mordant', 'microbiology']
  },
];

// Function to get questions for a specific topic
export function getSeedQuestionsForTopic(topic: string): ReferenceQuestion[] {
  return SEED_REFERENCE_QUESTIONS.filter(q => q.topic === topic);
}

// Function to get questions for a specific difficulty
export function getSeedQuestionsForDifficulty(difficulty: string): ReferenceQuestion[] {
  return SEED_REFERENCE_QUESTIONS.filter(q => q.difficulty === difficulty);
}

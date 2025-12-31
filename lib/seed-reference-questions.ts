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
    questionType: 'multiple-choice',
    questionText: 'A bacterial culture starts with 100 cells and doubles every 20 minutes. How many cells will be present after 2 hours?',
    correctAnswer: '6400 cells',
    options: [
      'A) 1200 cells',
      'B) 3200 cells',
      'C) 6400 cells',
      'D) 12800 cells'
    ],
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
  {
    topic: 'Microbe Mission',
    subtopic: 'Viruses',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'Which of the following best describes the lytic cycle of bacteriophage infection?',
    correctAnswer: 'The phage DNA is immediately replicated, producing new virions that lyse the cell',
    options: [
      'A) The phage DNA integrates into the host chromosome and remains dormant',
      'B) The phage DNA is immediately replicated, producing new virions that lyse the cell',
      'C) The host cell divides normally while carrying the phage DNA',
      'D) The phage RNA is reverse-transcribed into DNA before integration'
    ],
    explanation: 'In the lytic cycle, phage DNA hijacks cellular machinery immediately, producing many new phages that burst (lyse) the cell. The lysogenic cycle involves integration and dormancy.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['bacteriophage', 'lytic cycle', 'viral replication']
  },

  // ==================== DISEASE DETECTIVES ====================
  {
    topic: 'Disease Detectives',
    subtopic: 'Epidemiology',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'In a case-control study of lung cancer, 80 of 100 cases and 20 of 100 controls report a history of smoking. Calculate the odds ratio.',
    correctAnswer: '16',
    options: [
      'A) 4',
      'B) 8',
      'C) 16',
      'D) 20'
    ],
    explanation: 'OR = (a×d)/(b×c) = (80×80)/(20×20) = 6400/400 = 16. Cases: 80 exposed, 20 unexposed. Controls: 20 exposed, 80 unexposed.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['odds ratio', 'case-control', 'epidemiology']
  },
  {
    topic: 'Disease Detectives',
    subtopic: 'Outbreak Investigation',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'During a foodborne illness outbreak investigation, 45 of 60 people who ate potato salad became ill, compared to 5 of 50 who did not eat it. What is the attack rate among those exposed?',
    correctAnswer: '75%',
    options: [
      'A) 45%',
      'B) 60%',
      'C) 75%',
      'D) 90%'
    ],
    explanation: 'Attack rate (exposed) = ill exposed / total exposed = 45/60 = 0.75 = 75%.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['attack rate', 'outbreak', 'foodborne illness']
  },
  {
    topic: 'Disease Detectives',
    subtopic: 'Transmission',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'Which type of disease transmission occurs when pathogens are spread through contaminated water or food?',
    correctAnswer: 'Vehicle transmission',
    options: [
      'A) Direct contact transmission',
      'B) Droplet transmission',
      'C) Vehicle transmission',
      'D) Vector-borne transmission'
    ],
    explanation: 'Vehicle transmission involves contaminated inanimate objects (fomites) or substances (water, food, blood). Vectors are living organisms like mosquitoes.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['transmission', 'vehicle', 'contamination']
  },
  {
    topic: 'Disease Detectives',
    subtopic: 'Vaccination',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'If a disease has an R0 of 5, what percentage of the population needs to be immune to achieve herd immunity?',
    correctAnswer: '80%',
    options: [
      'A) 60%',
      'B) 70%',
      'C) 80%',
      'D) 90%'
    ],
    explanation: 'Herd immunity threshold = 1 - (1/R0) = 1 - (1/5) = 1 - 0.2 = 0.8 = 80%.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['herd immunity', 'R0', 'vaccination']
  },

  // ==================== FOSSILS ====================
  {
    topic: 'Fossils',
    subtopic: 'Geologic Time',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'During which geologic period did the first flowering plants (angiosperms) appear?',
    correctAnswer: 'Early Cretaceous',
    options: [
      'A) Late Jurassic',
      'B) Early Cretaceous',
      'C) Late Triassic',
      'D) Early Paleogene'
    ],
    explanation: 'Angiosperms first appeared in the Early Cretaceous, around 130-140 million years ago. They diversified rapidly during the Late Cretaceous.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['angiosperms', 'Cretaceous', 'plant evolution']
  },
  {
    topic: 'Fossils',
    subtopic: 'Fossil Types',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'What type of fossil preservation occurs when mineral-rich water replaces the original organic material cell by cell?',
    correctAnswer: 'Permineralization',
    options: [
      'A) Cast and mold',
      'B) Permineralization',
      'C) Carbonization',
      'D) Amber preservation'
    ],
    explanation: 'Permineralization (petrification) occurs when minerals precipitate in cellular spaces while original material may be replaced. Common in petrified wood.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['permineralization', 'preservation', 'petrification']
  },
  {
    topic: 'Fossils',
    subtopic: 'Paleontology',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'Trilobites are most closely related to which modern group of organisms?',
    correctAnswer: 'Horseshoe crabs and spiders (Chelicerata)',
    options: [
      'A) Insects',
      'B) Horseshoe crabs and spiders (Chelicerata)',
      'C) Crustaceans (crabs, lobsters)',
      'D) Mollusks'
    ],
    explanation: 'Trilobites are arthropods most closely related to chelicerates (horseshoe crabs, arachnids). They share similar body segmentation patterns.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['trilobites', 'arthropods', 'phylogeny']
  },
  {
    topic: 'Fossils',
    subtopic: 'Mass Extinctions',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'Which mass extinction event resulted in the highest percentage of marine species extinction?',
    correctAnswer: 'End-Permian extinction (~96% of marine species)',
    options: [
      'A) End-Ordovician extinction',
      'B) Late Devonian extinction',
      'C) End-Permian extinction (~96% of marine species)',
      'D) End-Cretaceous extinction'
    ],
    explanation: 'The End-Permian extinction (251 mya) was the largest, eliminating ~96% of marine species and ~70% of terrestrial species. Called "The Great Dying."',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['mass extinction', 'Permian', 'biodiversity']
  },

  // ==================== ORNITHOLOGY ====================
  {
    topic: 'Ornithology',
    subtopic: 'Bird Anatomy',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'Which bone in birds is formed by the fusion of the clavicles and provides attachment for flight muscles?',
    correctAnswer: 'Furcula (wishbone)',
    options: [
      'A) Sternum',
      'B) Coracoid',
      'C) Furcula (wishbone)',
      'D) Scapula'
    ],
    explanation: 'The furcula (wishbone) is formed by fused clavicles. It acts as a spring during flight, storing and releasing energy with each wingbeat.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['furcula', 'skeleton', 'flight adaptations']
  },
  {
    topic: 'Ornithology',
    subtopic: 'Bird Identification',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'Which of the following characteristics would help identify a bird as a member of the order Passeriformes?',
    correctAnswer: 'Anisodactyl foot arrangement with three toes forward, one back',
    options: [
      'A) Webbed feet for swimming',
      'B) Anisodactyl foot arrangement with three toes forward, one back',
      'C) Zygodactyl foot with two toes forward, two back',
      'D) Totipalmate feet with all four toes webbed'
    ],
    explanation: 'Passerines (perching birds) have anisodactyl feet: 3 toes forward, 1 back. This arrangement allows them to grip branches securely.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['Passeriformes', 'foot structure', 'identification']
  },
  {
    topic: 'Ornithology',
    subtopic: 'Migration',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'Which of the following birds undertakes the longest annual migration?',
    correctAnswer: 'Arctic Tern',
    options: [
      'A) Ruby-throated Hummingbird',
      'B) Arctic Tern',
      'C) Bar-tailed Godwit',
      'D) Monarch Butterfly'
    ],
    explanation: 'Arctic Terns migrate from Arctic to Antarctic and back, covering up to 44,000 miles annually—the longest migration of any animal.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['migration', 'Arctic Tern', 'bird behavior']
  },

  // ==================== EXPERIMENTAL DESIGN ====================
  {
    topic: 'Experimental Design',
    subtopic: 'Variables',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'In an experiment testing how fertilizer concentration affects plant growth, what type of variable is the height of the plants after 4 weeks?',
    correctAnswer: 'Dependent variable',
    options: [
      'A) Independent variable',
      'B) Dependent variable',
      'C) Controlled variable',
      'D) Confounding variable'
    ],
    explanation: 'The dependent variable is what is measured as the outcome. Plant height depends on the fertilizer concentration (independent variable).',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['dependent variable', 'experimental design', 'variables']
  },
  {
    topic: 'Experimental Design',
    subtopic: 'Statistics',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'A researcher obtains a p-value of 0.03 when comparing two groups. Using α = 0.05, what is the correct conclusion?',
    correctAnswer: 'Reject the null hypothesis; the difference is statistically significant',
    options: [
      'A) Accept the null hypothesis; no significant difference',
      'B) Reject the null hypothesis; the difference is statistically significant',
      'C) The test is inconclusive',
      'D) Accept the alternative hypothesis with certainty'
    ],
    explanation: 'When p-value (0.03) < α (0.05), we reject the null hypothesis. This suggests a statistically significant difference between groups.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['p-value', 'hypothesis testing', 'statistics']
  },
  {
    topic: 'Experimental Design',
    subtopic: 'Controls',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'Why is a control group essential in a well-designed experiment?',
    correctAnswer: 'It provides a baseline for comparison to isolate the effect of the independent variable',
    options: [
      'A) It increases the sample size of the experiment',
      'B) It provides a baseline for comparison to isolate the effect of the independent variable',
      'C) It eliminates all sources of error',
      'D) It proves the hypothesis is correct'
    ],
    explanation: 'Control groups receive no treatment (or placebo) and provide a baseline. Without them, you cannot determine if changes are due to the treatment or other factors.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['control group', 'experimental design', 'baseline']
  },

  // ==================== WRITE IT DO IT ====================
  {
    topic: 'Write It Do It',
    subtopic: 'Technical Writing',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'When writing instructions for assembling a complex object, what is the most important principle to follow?',
    correctAnswer: 'Use clear, sequential steps with specific measurements and orientations',
    options: [
      'A) Use as few words as possible',
      'B) Use clear, sequential steps with specific measurements and orientations',
      'C) Include personal opinions about the best approach',
      'D) Write in paragraph form for readability'
    ],
    explanation: 'Effective technical writing uses numbered sequential steps, precise measurements, and clear orientation terms (left, right, clockwise).',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['technical writing', 'instructions', 'clarity']
  },
  {
    topic: 'Write It Do It',
    subtopic: 'Spatial Description',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'Which directional term is most precise for describing the position of an object?',
    correctAnswer: '"Position the cube 3 cm to the right of the cylinder, edges aligned"',
    options: [
      'A) "Put the cube near the cylinder"',
      'B) "The cube goes next to the cylinder"',
      'C) "Position the cube 3 cm to the right of the cylinder, edges aligned"',
      'D) "Place the cube somewhere around the cylinder"'
    ],
    explanation: 'Precise descriptions include exact measurements, directional terms (right, left, above), and reference points (edges aligned).',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['spatial description', 'precision', 'directions']
  },

  // ==================== MORE ASTRONOMY ====================
  {
    topic: 'Astronomy',
    subtopic: 'Deep Sky Objects',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'What type of deep sky object is M31 (Andromeda)?',
    correctAnswer: 'Spiral galaxy',
    options: [
      'A) Globular cluster',
      'B) Planetary nebula',
      'C) Spiral galaxy',
      'D) Elliptical galaxy'
    ],
    explanation: 'M31 (Andromeda Galaxy) is a large spiral galaxy, the nearest major galaxy to the Milky Way at about 2.5 million light-years away.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['Andromeda', 'galaxies', 'Messier objects']
  },
  {
    topic: 'Astronomy',
    subtopic: 'Planetary Science',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'Which planet has the shortest orbital period around the Sun?',
    correctAnswer: 'Mercury (88 Earth days)',
    options: [
      'A) Venus (225 Earth days)',
      'B) Mercury (88 Earth days)',
      'C) Mars (687 Earth days)',
      'D) Earth (365 Earth days)'
    ],
    explanation: 'Mercury, being closest to the Sun, has the shortest orbital period at approximately 88 Earth days per orbit.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['Mercury', 'orbital period', 'planets']
  },

  // ==================== MORE CHEMISTRY LAB ====================
  {
    topic: 'Chemistry Lab',
    subtopic: 'Titration',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'In a titration of 25.0 mL of HCl with 0.100 M NaOH, the endpoint is reached after adding 30.0 mL of NaOH. What is the molarity of the HCl?',
    correctAnswer: '0.120 M',
    options: [
      'A) 0.083 M',
      'B) 0.100 M',
      'C) 0.120 M',
      'D) 0.150 M'
    ],
    explanation: 'At endpoint: mol NaOH = mol HCl. mol NaOH = 0.030 L × 0.100 M = 0.003 mol. [HCl] = 0.003 mol / 0.025 L = 0.120 M.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['titration', 'molarity', 'calculation']
  },
  {
    topic: 'Chemistry Lab',
    subtopic: 'Organic Chemistry',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'Which functional group is present in ethanol (C₂H₅OH)?',
    correctAnswer: 'Hydroxyl group (-OH)',
    options: [
      'A) Carbonyl group (C=O)',
      'B) Hydroxyl group (-OH)',
      'C) Carboxyl group (-COOH)',
      'D) Amino group (-NH₂)'
    ],
    explanation: 'Ethanol contains a hydroxyl (-OH) group attached to an ethyl group. This defines it as an alcohol.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['functional groups', 'alcohols', 'organic chemistry']
  },

  // ==================== MORE ECOLOGY ====================
  {
    topic: 'Ecology',
    subtopic: 'Biomes',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'Which biome is characterized by permafrost, low biodiversity, and a short growing season?',
    correctAnswer: 'Tundra',
    options: [
      'A) Taiga',
      'B) Tundra',
      'C) Temperate grassland',
      'D) Desert'
    ],
    explanation: 'Tundra biomes have permafrost (permanently frozen soil), extremely short growing seasons, and low species diversity. Found in Arctic regions.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['biomes', 'tundra', 'permafrost']
  },
  {
    topic: 'Ecology',
    subtopic: 'Symbiosis',
    difficulty: 'Regional',
    questionType: 'multiple-choice',
    questionText: 'A clownfish living among sea anemone tentacles is an example of which type of symbiosis?',
    correctAnswer: 'Mutualism',
    options: [
      'A) Parasitism',
      'B) Commensalism',
      'C) Mutualism',
      'D) Competition'
    ],
    explanation: 'Clownfish and anemones exhibit mutualism: both benefit. The clownfish gets protection while the anemone gets food scraps and cleaning.',
    sourceYear: 2021,
    sourceTournament: 'Regional',
    qualityScore: 8,
    tags: ['symbiosis', 'mutualism', 'marine ecology']
  },

  // ==================== MORE DYNAMIC PLANET ====================
  {
    topic: 'Dynamic Planet',
    subtopic: 'Glaciers',
    difficulty: 'National',
    questionType: 'multiple-choice',
    questionText: 'What type of moraine forms at the terminus of a glacier?',
    correctAnswer: 'Terminal moraine',
    options: [
      'A) Lateral moraine',
      'B) Medial moraine',
      'C) Terminal moraine',
      'D) Ground moraine'
    ],
    explanation: 'Terminal (end) moraines form at the farthest advance of a glacier. Lateral moraines form along sides; medial moraines form when glaciers merge.',
    sourceYear: 2023,
    sourceTournament: 'National',
    qualityScore: 10,
    tags: ['glaciers', 'moraines', 'glacial deposits']
  },
  {
    topic: 'Dynamic Planet',
    subtopic: 'Weather',
    difficulty: 'State',
    questionType: 'multiple-choice',
    questionText: 'What atmospheric condition causes a temperature inversion?',
    correctAnswer: 'Warm air trapped above cooler air near the surface',
    options: [
      'A) Cold air sinking rapidly from high altitude',
      'B) Warm air trapped above cooler air near the surface',
      'C) Uniform temperature throughout the atmosphere',
      'D) Rapid heating of the upper atmosphere'
    ],
    explanation: 'Temperature inversions occur when warm air overlies cooler surface air, trapping pollutants. Normal conditions have temperature decreasing with altitude.',
    sourceYear: 2022,
    sourceTournament: 'State',
    qualityScore: 9,
    tags: ['temperature inversion', 'atmosphere', 'weather']
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

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveTest, logApiUsage, getSubscriptionStatus, getUserMonthlyAIGenerations } from '@/lib/database';
import { generateId } from '@/lib/utils';
import { Test, Question } from '@/lib/types';
import { auth } from '@/auth';
import { FREE_TIER_MONTHLY_LIMIT } from '@/lib/stripe';

// GPT-4o pricing (as of 2024) - using full model for better quality
const PRICE_PER_1K_PROMPT_TOKENS = 0.0025;
const PRICE_PER_1K_COMPLETION_TOKENS = 0.01;

// Increase function timeout for serverless
export const maxDuration = 60; // 60 seconds max

// Lazy-load OpenAI client to avoid build errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface GenerateRequest {
  topic: string;
  questionCount?: number;
  difficulty?: 'Invitational' | 'Regional' | 'State' | 'National';
}

// Netlify has 26s timeout (Pro) or 10s (Free)
// OpenAI needs ~2-3 seconds per question, so limit to 10 questions max for reliability
const MAX_QUESTIONS_FOR_TIMEOUT = 10;

// Competition level difficulty descriptions with specific requirements
const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
  'Invitational': `Invitational-style (EASIEST):
- Simple recall and basic identification questions
- Direct questions with straightforward answers
- Focus on fundamental definitions and concepts
- Single-step problems only
- Example: "What is the name of the bone in the upper arm?"`,

  'Regional': `Regional-style (MODERATE):
- Mix of recall and application questions
- Some questions requiring 2-step reasoning
- Testing core concepts with basic applications
- Include some "why" and "how" questions
- Example: "If a first-class lever has an effort arm of 3m and a load arm of 1m, what is its mechanical advantage?"`,

  'State': `State-level (CHALLENGING):
- Multi-step reasoning required for most questions
- Application of concepts to novel scenarios
- Connections between multiple concepts
- Include data interpretation and analysis
- Obscure but testable details
- Example: "A patient presents with decreased deep tendon reflexes, muscle weakness, and fasciculations. Which motor neuron type is most likely affected, and what would you expect to see on EMG?"`,

  'National': `National-level (EXTREMELY DIFFICULT):
- Expect only top competitors to answer correctly
- Deep, nuanced understanding required
- Cutting-edge or highly specialized knowledge
- Complex multi-step calculations
- Integration of multiple advanced concepts
- Trick questions that test precise understanding
- Obscure exceptions and edge cases
- Example: "Calculate the Schwarzschild radius for a 3 solar mass black hole, then determine the tidal force experienced by a 2-meter tall astronaut at this radius. Would the astronaut survive? Justify with calculations."`,
};

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'Anatomy and Physiology': `human body systems, organ functions, tissue types, homeostasis, and physiological processes.

NERVOUS SYSTEM:
- CNS = Brain + Spinal cord. PNS = Everything else (cranial nerves, spinal nerves)
- Sympathetic = "fight or flight" (dilates pupils, increases HR, inhibits digestion)
- Parasympathetic = "rest and digest" (constricts pupils, decreases HR, stimulates digestion)
- Neuron parts: Dendrites (receive) → Cell body → Axon (transmit) → Axon terminals (release neurotransmitters)
- Action potential: Resting (-70mV) → Depolarization (Na+ in) → Repolarization (K+ out)
- Neurotransmitters: Acetylcholine (muscle), Dopamine (reward), Serotonin (mood), GABA (inhibitory), Glutamate (excitatory)
- Brain regions: Frontal (reasoning), Parietal (sensory), Temporal (hearing/memory), Occipital (vision), Cerebellum (coordination), Brainstem (vital functions)

CARDIOVASCULAR SYSTEM:
- Blood flow: Vena cava → Right atrium → Tricuspid valve → Right ventricle → Pulmonary valve → Pulmonary artery → LUNGS → Pulmonary vein → Left atrium → Mitral/Bicuspid valve → Left ventricle → Aortic valve → Aorta → Body
- Arteries = AWAY from heart (thick walls, high pressure). Veins = toward heart (thin walls, valves, low pressure)
- Cardiac cycle: Systole (contraction, ~120 mmHg), Diastole (relaxation, ~80 mmHg)
- Blood components: RBCs (oxygen), WBCs (immune), Platelets (clotting), Plasma (55% of blood)
- Cardiac output = Heart rate × Stroke volume

RESPIRATORY SYSTEM:
- Path: Nose/mouth → Pharynx → Larynx → Trachea → Bronchi → Bronchioles → Alveoli
- Gas exchange in alveoli by diffusion (O₂ in, CO₂ out)
- Diaphragm contracts DOWN and flattens during INHALATION (increases thoracic volume)
- Tidal volume (~500mL), Vital capacity (~4-5L), Total lung capacity (~6L)
- Hemoglobin: 4 heme groups, each binds 1 O₂ (max 4 O₂ per hemoglobin)

DIGESTIVE SYSTEM:
- Order: Mouth (mechanical + amylase) → Esophagus (peristalsis) → Stomach (HCl + pepsin for protein) → Small intestine (most digestion/absorption) → Large intestine (water absorption) → Rectum
- Small intestine: Duodenum (receives bile + pancreatic juice), Jejunum, Ileum
- Enzymes: Amylase (starch→sugar), Protease/Pepsin (protein→amino acids), Lipase (fats→fatty acids)
- Villi and microvilli increase surface area for absorption
- Liver produces bile (stored in gallbladder), detoxifies blood

SKELETAL SYSTEM:
- 206 bones in adults, 270 in infants (some fuse)
- Axial skeleton (80): Skull, vertebrae, ribs, sternum
- Appendicular skeleton (126): Arms, legs, pelvis, shoulder girdle
- Bone types: Long (femur), Short (carpals), Flat (skull), Irregular (vertebrae), Sesamoid (patella)
- Bone cells: Osteoblasts (build), Osteoclasts (break down), Osteocytes (maintain)
- Joints: Synovial (freely movable), Cartilaginous (slightly movable), Fibrous (immovable)

MUSCULAR SYSTEM:
- Skeletal: Voluntary, striated, multinucleated, attached to bones
- Cardiac: Involuntary, striated, branched, intercalated discs, only in heart
- Smooth: Involuntary, NOT striated, in organs/blood vessels
- Sliding filament theory: Actin and myosin slide past each other
- ATP needed for both contraction AND relaxation (rigor mortis = no ATP)

ENDOCRINE SYSTEM:
- Hypothalamus: Controls pituitary, releases hormones
- Pituitary (master gland): GH, TSH, ACTH, FSH, LH, Prolactin, ADH, Oxytocin
- Thyroid: T3/T4 (metabolism), Calcitonin (lowers blood Ca²⁺)
- Parathyroid: PTH (raises blood Ca²⁺)
- Adrenal cortex: Cortisol (stress), Aldosterone (Na⁺/K⁺ balance)
- Adrenal medulla: Epinephrine/Norepinephrine (fight or flight)
- Pancreas: Insulin (lowers blood glucose), Glucagon (raises blood glucose)
- Negative feedback: Most hormones regulated this way

IMMUNE SYSTEM:
- Innate immunity: Skin, mucous membranes, phagocytes, inflammation (non-specific, immediate)
- Adaptive immunity: B cells (antibodies), T cells (cell-mediated) (specific, memory)
- Antibodies (immunoglobulins): IgG (most common), IgA (mucosal), IgM (first response), IgE (allergies)
- T cells: Helper (CD4+), Cytotoxic (CD8+), Regulatory
- Lymphatic system: Lymph nodes, spleen, thymus, tonsils

COMMON MISTAKES:
- Confusing arteries vs veins
- Mixing up sympathetic vs parasympathetic
- Getting hormone sources wrong
- Confusing osteoblasts (build) vs osteoclasts (break down)`,
  'Astronomy': `stellar evolution, HR diagrams, galaxy types, planetary science, celestial mechanics, cosmology, and observational techniques.

KEY FORMULAS (VERIFY ALL CALCULATIONS):
- Distance modulus: m - M = 5 log(d/10), where d is in parsecs, m = apparent magnitude, M = absolute magnitude
- Parallax: d(pc) = 1/p(arcsec). Example: p = 0.1 arcsec → d = 10 pc
- Stefan-Boltzmann Law: L = 4πR²σT⁴ (σ = 5.67×10⁻⁸ W/m²K⁴). Luminosity ∝ R²T⁴
- Wien's Law: λmax = 2.898×10⁻³/T (meters). Hotter = shorter wavelength (bluer)
- Kepler's 3rd Law: P² = a³ (P in years, a in AU) OR P² = (4π²/GM)a³
- Escape velocity: v = √(2GM/r)
- Orbital velocity: v = √(GM/r)
- Schwarzschild radius: Rs = 2GM/c²
- Hubble's Law: v = H₀d (H₀ ≈ 70 km/s/Mpc)
- Apparent brightness: b = L/(4πd²)

STELLAR CLASSIFICATION:
- Spectral types (hot→cool): O B A F G K M ("Oh Be A Fine Girl/Guy Kiss Me")
- O: >30,000K, blue, ionized helium lines
- B: 10,000-30,000K, blue-white, neutral helium
- A: 7,500-10,000K, white, strong hydrogen lines (Vega, Sirius)
- F: 6,000-7,500K, yellow-white
- G: 5,200-6,000K, yellow (Sun = G2V)
- K: 3,700-5,200K, orange
- M: <3,700K, red, molecular bands (TiO)
- Luminosity classes: I (supergiant), II (bright giant), III (giant), IV (subgiant), V (main sequence/dwarf)

HR DIAGRAM:
- X-axis: Temperature (DECREASING left to right) or Spectral type (O→M) or Color index (B-V)
- Y-axis: Luminosity (increasing up) or Absolute magnitude (decreasing up, brighter = more negative)
- Main sequence: Diagonal band, hydrogen fusion, ~90% of stars
- Red giants: Upper right, hydrogen shell burning, expanded cool stars
- White dwarfs: Lower left, hot but dim, Earth-sized, electron degeneracy
- Mass determines position on main sequence: More massive = hotter, brighter, shorter-lived

STELLAR EVOLUTION:
- Low mass (<0.5 M☉): Main sequence → Red giant → Planetary nebula → White dwarf
- Medium mass (0.5-8 M☉): Main sequence → Red giant → Helium flash → Horizontal branch → AGB → Planetary nebula → White dwarf
- High mass (>8 M☉): Main sequence → Supergiant → Supernova → Neutron star (1.4-3 M☉) or Black hole (>3 M☉)
- Main sequence lifetime ∝ M/L ∝ 1/M² (more massive = shorter life)

SOLAR SYSTEM:
- Terrestrial planets: Mercury, Venus, Earth, Mars (rocky, dense, small)
- Gas giants: Jupiter, Saturn (hydrogen/helium, low density)
- Ice giants: Uranus, Neptune (water, ammonia, methane)
- Asteroid belt: Between Mars and Jupiter
- Kuiper belt: Beyond Neptune, includes Pluto
- Oort cloud: Spherical shell, source of long-period comets
- Planet distances: Mercury 0.4 AU, Venus 0.7, Earth 1, Mars 1.5, Jupiter 5.2, Saturn 9.5, Uranus 19.2, Neptune 30

COSMOLOGY:
- Big Bang: ~13.8 billion years ago
- CMB (Cosmic Microwave Background): Radiation from 380,000 years after Big Bang, ~2.7 K
- Dark matter: ~27% of universe, doesn't emit light, detected by gravity
- Dark energy: ~68% of universe, causes accelerating expansion
- Observable universe radius: ~46 billion light-years

COMMON MISTAKES:
- HR diagram temperature axis is REVERSED (hot on left)
- Confusing apparent vs absolute magnitude
- Forgetting Wien's law gives wavelength in meters
- Using wrong units in Kepler's 3rd law`,
  'Chemistry Lab': `chemical reactions, stoichiometry, equilibrium, acid-base chemistry, redox reactions, lab safety, and analytical techniques.

CONCENTRATION FORMULAS:
- Molarity (M) = moles solute / liters solution. Units: mol/L
- Molality (m) = moles solute / kg solvent. Units: mol/kg
- Dilution: M₁V₁ = M₂V₂ (moles before = moles after)
- Mass percent = (mass solute / mass solution) × 100%
- Parts per million (ppm) = (mass solute / mass solution) × 10⁶
- Mole fraction: χA = nA / (nA + nB + ...)

STOICHIOMETRY:
- Moles = mass / molar mass = molecules / (6.022×10²³)
- At STP (0°C, 1 atm): 1 mole gas = 22.4 L
- Limiting reagent: Reagent that runs out first, determines max product
- % yield = (actual yield / theoretical yield) × 100%
- Molar mass from periodic table: Add atomic masses of all atoms

ACID-BASE CHEMISTRY:
- pH = -log[H⁺], pOH = -log[OH⁻], pH + pOH = 14 (at 25°C)
- Kw = [H⁺][OH⁻] = 1×10⁻¹⁴ at 25°C
- Strong acids (completely dissociate): HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄
- Strong bases: NaOH, KOH, Ca(OH)₂, Ba(OH)₂
- Weak acid: Ka = [H⁺][A⁻]/[HA], pKa = -log(Ka)
- Weak base: Kb = [BH⁺][OH⁻]/[B], pKb = -log(Kb)
- Ka × Kb = Kw for conjugate pairs
- Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])
- Buffer: Weak acid + conjugate base, resists pH change
- Titration: Equivalence point when moles acid = moles base

GAS LAWS:
- Ideal Gas Law: PV = nRT (R = 0.0821 L·atm/mol·K = 8.314 J/mol·K)
- Boyle's Law: P₁V₁ = P₂V₂ (constant T, n)
- Charles's Law: V₁/T₁ = V₂/T₂ (constant P, n)
- Avogadro's Law: V₁/n₁ = V₂/n₂ (constant P, T)
- Dalton's Law: Ptotal = P₁ + P₂ + P₃ + ... (partial pressures)
- Graham's Law: Rate₁/Rate₂ = √(M₂/M₁) (effusion/diffusion)

EQUILIBRIUM:
- Keq = [products]^coefficients / [reactants]^coefficients (only gases and aqueous)
- Q < K: Forward reaction favored, Q > K: Reverse reaction favored
- Le Chatelier's Principle: System shifts to counteract stress
- Ksp = [ions]^coefficients (solubility product)

REDOX REACTIONS:
- Oxidation: Loss of electrons, increase in oxidation number
- Reduction: Gain of electrons, decrease in oxidation number
- OIL RIG: Oxidation Is Loss, Reduction Is Gain
- Oxidizing agent: Gets reduced, causes oxidation
- Reducing agent: Gets oxidized, causes reduction
- Balancing: Balance atoms, then charges with electrons

THERMOCHEMISTRY:
- ΔH = Hproducts - Hreactants (negative = exothermic, positive = endothermic)
- q = mcΔT (specific heat), q = nCΔT (molar heat capacity)
- Hess's Law: ΔH total = sum of ΔH for each step
- Bond energy: Energy required to break bonds

LAB SAFETY & TECHNIQUES:
- Always add acid to water (never water to acid) - "Do as you oughta, add acid to water"
- Meniscus: Read at bottom of curve for most liquids
- Significant figures: Measurement uncertainty, trailing zeros matter
- Burette: 0.01 mL precision, used for titrations
- Graduated cylinder: ~1% precision, better than beakers

COMMON MISTAKES:
- Forgetting to convert temperature to Kelvin for gas laws
- Using wrong R value for units
- Confusing molarity vs molality
- Adding water to acid instead of acid to water`,
  'Disease Detectives': `epidemiology concepts, disease transmission, outbreak investigation, study designs, and public health.

KEY FORMULAS & DEFINITIONS:
- Incidence rate = New cases / Population at risk × time period
- Prevalence = All cases (new + existing) / Total population (snapshot in time)
- Attack rate = Cases / Exposed population (used in outbreaks)
- Case fatality rate = Deaths / Cases × 100%
- Mortality rate = Deaths / Total population
- Relative Risk (RR) = Incidence in exposed / Incidence in unexposed (used in cohort studies)
- Odds Ratio (OR) = (a×d)/(b×c) from 2x2 table (used in case-control studies)

STUDY TYPES:
- Cohort: Follow exposed vs unexposed forward in time → Calculate RR
- Case-Control: Compare cases vs controls looking backward → Calculate OR
- Cross-sectional: Snapshot, measures prevalence
- Randomized Controlled Trial (RCT): Gold standard, random assignment

COMMON MISTAKES: Confusing incidence (new cases) vs prevalence (all cases). Using RR for case-control studies (should use OR).`,
  'Dynamic Planet': `plate tectonics, earthquakes, volcanoes, rock cycle, weathering, erosion, and Earth structure.

KEY FACTS TO VERIFY:
- Plate boundaries: Divergent (plates separate, mid-ocean ridges), Convergent (plates collide, subduction/mountains), Transform (plates slide past, earthquakes)
- Earth layers: Crust (5-70km) → Mantle (2900km) → Outer Core (liquid iron, 2200km) → Inner Core (solid iron, 1200km radius)
- Earthquake waves: P-waves (Primary, fastest, compressional), S-waves (Secondary, shear, can't travel through liquids), Surface waves (slowest, most destructive)
- Richter scale: Logarithmic! Each whole number = 10× amplitude, ~32× energy
- Rock cycle: Igneous (from magma) → Sedimentary (from weathering/deposition) → Metamorphic (heat/pressure) → can become any other type
- Volcanoes: Shield (gentle slopes, basaltic, Hawaii), Stratovolcano (steep, explosive, Mt. St. Helens), Cinder cone (smallest)

COMMON MISTAKES: Confusing P-waves and S-waves. Forgetting Richter scale is logarithmic.`,
  'Ecology': `population dynamics, community interactions, energy flow, nutrient cycles, biomes, and succession.

KEY CONCEPTS TO VERIFY:
- Energy transfer: Only ~10% energy transfers between trophic levels (10% rule)
- Population growth: Exponential (J-curve, unlimited resources) vs Logistic (S-curve, carrying capacity K)
- Species interactions: Mutualism (+/+), Commensalism (+/0), Parasitism (+/-), Predation (+/-), Competition (-/-)
- Succession: Primary (bare rock, no soil) vs Secondary (after disturbance, soil present)
- Biomes: Tundra (coldest), Taiga (largest), Temperate forest, Grassland, Desert, Tropical rainforest (most biodiversity)
- Carbon cycle: Photosynthesis removes CO₂, Respiration/decomposition/combustion release CO₂
- Nitrogen cycle: N₂ → NH₃ (nitrogen fixation by bacteria) → NO₂⁻/NO₃⁻ (nitrification) → N₂ (denitrification)

KEY FORMULAS:
- Population growth rate: r = (births - deaths) / population
- Carrying capacity equation: dN/dt = rN(K-N)/K

COMMON MISTAKES: Confusing primary vs secondary succession. Forgetting only ~10% energy transfers up trophic levels.`,
  'Experimental Design': `variables, hypothesis formation, controls, data analysis, and statistics.

KEY CONCEPTS TO VERIFY:
- Independent variable: What YOU change/manipulate
- Dependent variable: What you MEASURE (depends on independent variable)
- Controlled variables: Everything kept CONSTANT
- Control group: No treatment, baseline for comparison
- Experimental group: Receives the treatment

STATISTICAL CONCEPTS:
- Mean = sum/count, Median = middle value, Mode = most frequent
- Standard deviation: Measure of spread around the mean
- Sample size: Larger = more reliable results
- P-value: < 0.05 typically means statistically significant
- Correlation ≠ Causation!

ERROR TYPES:
- Systematic error: Consistent bias in one direction (e.g., miscalibrated instrument)
- Random error: Unpredictable variations (reduce by averaging multiple trials)
- Precision: How close repeated measurements are to each other
- Accuracy: How close measurements are to true value

COMMON MISTAKES: Confusing independent vs dependent variables. Claiming causation from correlation alone.`,
  'Fermi Questions': `order-of-magnitude estimation, dimensional analysis, and logical reasoning.

KEY REFERENCE VALUES TO USE:
- US population: ~330 million, World: ~8 billion
- Average human lifespan: ~80 years, heartbeats: ~100,000/day
- Speed of light: 3×10⁸ m/s, Speed of sound: ~340 m/s
- Earth radius: ~6,400 km, Earth-Sun distance: ~150 million km (1 AU)
- Water density: 1 g/cm³ = 1000 kg/m³
- Room temperature: ~20-25°C = ~300 K
- 1 year ≈ π×10⁷ seconds ≈ 3.15×10⁷ seconds
- 1 mile ≈ 1.6 km, 1 inch = 2.54 cm

ESTIMATION TECHNIQUES:
- Break into smaller, estimable parts
- Use geometric mean for ranges: √(low × high)
- Round to powers of 10
- Check units cancel correctly (dimensional analysis)

COMMON MISTAKES: Forgetting unit conversions. Not breaking complex problems into simpler parts.`,
  'Forensics': `evidence analysis, toxicology, DNA analysis, document examination, and crime scene procedures.

KEY FACTS TO VERIFY:
- Fingerprint patterns: Loop (60-65%, most common), Whorl (30-35%), Arch (5%, rarest)
- Blood types: A, B, AB (universal recipient), O (universal donor). Rh+ or Rh-
- Blood spatter: High velocity = fine mist, Low velocity = large drops. Direction from elongation
- Rigor mortis: Begins 2-4 hrs, peaks 12 hrs, dissipates 24-36 hrs after death
- Livor mortis: Blood pooling, begins immediately, fixed after 8-12 hrs
- Algor mortis: Body cooling, ~1.5°F/hr until ambient temperature

DNA ANALYSIS:
- STR (Short Tandem Repeats): Used in forensic DNA profiling
- PCR (Polymerase Chain Reaction): Amplifies small DNA samples
- Mitochondrial DNA: Inherited from mother only, useful for degraded samples

COMMON MISTAKES: Confusing loop vs whorl fingerprints. Getting blood type compatibility wrong.`,
  'Fossils': `fossil types, preservation methods, index fossils, geological time periods, and paleoenvironments.

GEOLOGICAL TIME SCALE (oldest to youngest):
- Precambrian (4.6 bya - 541 mya): First life, stromatolites, Ediacaran fauna
- Paleozoic (541-252 mya): Cambrian explosion, trilobites, first fish, amphibians, reptiles. Ends with largest mass extinction (Permian)
- Mesozoic (252-66 mya): Age of dinosaurs. Triassic → Jurassic → Cretaceous. Ends with K-Pg extinction (asteroid)
- Cenozoic (66 mya - present): Age of mammals. Paleogene → Neogene → Quaternary

INDEX FOSSILS (must be widespread, short-lived, abundant, easily identified):
- Trilobites: Paleozoic (especially Cambrian-Ordovician)
- Ammonites: Mesozoic
- Brachiopods: Throughout Paleozoic

FOSSIL TYPES:
- Body fossils: Actual remains (bones, shells, teeth)
- Trace fossils: Evidence of activity (footprints, burrows, coprolites)
- Mold: Cavity left by organism; Cast: Mineral filling of mold

COMMON MISTAKES: Mixing up geological eras/periods. Confusing mold vs cast.`,
  'Machines': `simple machines, mechanical advantage, efficiency, work, power, energy, forces, and compound machines.

NEWTON'S LAWS:
- 1st Law (Inertia): Object at rest stays at rest, object in motion stays in motion, unless acted on by net force
- 2nd Law: F = ma (Force = mass × acceleration). Unit: Newton (N) = kg·m/s²
- 3rd Law: Every action has equal and opposite reaction. Forces come in pairs

FORCES:
- Weight: W = mg (g = 9.8 m/s² on Earth, often rounded to 10 m/s²)
- Normal force: Perpendicular to surface, prevents objects from passing through
- Friction: f = μN (μ = coefficient of friction, N = normal force)
  - Static friction: μs (prevents motion, usually larger)
  - Kinetic friction: μk (during motion, usually smaller)
- Tension: Force transmitted through rope/string/cable
- Spring force: F = kx (Hooke's Law, k = spring constant)
- Net force: Vector sum of all forces. If Fnet = 0, object is in equilibrium

WORK, ENERGY, POWER:
- Work = Force × Distance × cos(θ). Unit: Joules (J) = N·m
- Work done by gravity: W = mgh (positive if falling, negative if rising)
- Work done by friction: W = -fd (always negative, removes energy)
- Power = Work / Time = Force × Velocity. Unit: Watts (W) = J/s
- 1 horsepower = 746 W
- Kinetic Energy: KE = ½mv². Unit: Joules
- Gravitational PE: PE = mgh (h = height above reference)
- Elastic PE: PE = ½kx² (x = displacement from equilibrium)
- Conservation of Energy: KE₁ + PE₁ = KE₂ + PE₂ (no friction)
- Work-Energy Theorem: Wnet = ΔKE = ½mv₂² - ½mv₁²

TORQUE AND ROTATIONAL MOTION:
- Torque = Force × Lever arm = F × r × sin(θ). Unit: N·m
- Equilibrium: Στ = 0 (sum of torques = 0)
- Clockwise torques are negative, counterclockwise are positive (by convention)
- Center of mass: Point where weight can be considered to act

MECHANICAL ADVANTAGE:
- IMA (Ideal MA) = Distance effort moves / Distance load moves = dE/dL (theoretical, no friction)
- AMA (Actual MA) = Load force / Effort force = FL/FE (measured, includes friction)
- Efficiency = (AMA / IMA) × 100% = (Work out / Work in) × 100%
- Efficiency < 100% always in real machines due to friction

SIMPLE MACHINE IMA FORMULAS (VERIFY UNIT CONVERSIONS!):
- LEVER: IMA = Effort arm / Load arm = dE/dL
  - 1st class: Fulcrum between effort and load (seesaw, scissors). IMA can be >, <, or = 1
  - 2nd class: Load between fulcrum and effort (wheelbarrow, nutcracker). IMA > 1 always
  - 3rd class: Effort between fulcrum and load (tweezers, fishing rod). IMA < 1 always
- PULLEY: IMA = Number of rope segments supporting the load
  - Fixed pulley: IMA = 1 (changes direction only)
  - Movable pulley: IMA = 2
  - Block and tackle: Count ropes going UP from movable pulley(s)
- INCLINED PLANE: IMA = Length / Height = L/h
  - Longer ramp = greater MA = less effort but more distance
- WHEEL & AXLE: IMA = Wheel radius / Axle radius = R/r
  - Examples: Steering wheel, doorknob, screwdriver
- SCREW: IMA = 2πr / pitch = Circumference of handle / pitch
  - Pitch = distance between threads = distance traveled in 1 rotation
  - EXAMPLE: r = 4cm, pitch = 2mm → IMA = 2π(40mm)/2mm = 251.3/2 = 125.66
- WEDGE: IMA = Length / Width (thickness at base)
  - Examples: Axe, knife, doorstop, chisel

COMPOUND MACHINES:
- Combination of 2+ simple machines
- Total IMA = IMA₁ × IMA₂ × IMA₃ × ...
- Total efficiency = eff₁ × eff₂ × eff₃ × ... (compounds are LESS efficient)
- Examples: Scissors (lever + wedge), Bicycle (wheel & axle + lever + pulley)

COMMON MISTAKES:
- Forgetting unit conversions (cm to mm, etc.) - THIS IS CRITICAL
- Using wrong pulley count (count supporting ropes, not total ropes)
- Confusing IMA vs AMA (IMA = distances, AMA = forces)
- Forgetting efficiency is always < 100%
- Using wrong lever class
- Forgetting that g ≈ 10 m/s² for calculations`,
  'Microbe Mission': `bacterial structure, viral replication, fungal characteristics, microbial ecology, and lab techniques.

KEY FACTS TO VERIFY:
- Bacteria: Prokaryotic (no nucleus), cell wall (peptidoglycan), reproduce by binary fission
- Gram staining: Gram+ = thick peptidoglycan, retains crystal violet (purple). Gram- = thin peptidoglycan, outer membrane, pink/red
- Bacterial shapes: Cocci (spheres), Bacilli (rods), Spirilla (spirals)
- Viruses: NOT cells, need host to reproduce, contain DNA OR RNA (not both), capsid protein coat
- Viral replication: Lytic (destroys cell) vs Lysogenic (integrates into host DNA)
- Fungi: Eukaryotic, cell walls of chitin, heterotrophs, reproduce by spores
- Protists: Eukaryotic, diverse group including algae, protozoa, slime molds

DISEASE EXAMPLES:
- Bacterial: Tuberculosis, Strep throat, E. coli, Salmonella
- Viral: Influenza, HIV, COVID-19, Rabies
- Fungal: Athlete's foot, Ringworm, Candidiasis

COMMON MISTAKES: Calling viruses "alive" or cells. Confusing Gram+ vs Gram- staining results.`,
  'Optics': `reflection, refraction, lenses, mirrors, optical instruments, wave optics, and electromagnetic spectrum.

REFLECTION:
- Law of Reflection: θincident = θreflected (measured from normal)
- Plane mirror: Image is virtual, upright, same size, laterally inverted
- Specular reflection: Smooth surface, clear image
- Diffuse reflection: Rough surface, scattered light

REFRACTION:
- Snell's Law: n₁sinθ₁ = n₂sinθ₂
- Index of refraction: n = c/v (c = speed in vacuum, v = speed in medium)
- Common indices: Vacuum = 1.00, Air ≈ 1.00, Water = 1.33, Glass ≈ 1.5, Diamond = 2.42
- Light bends TOWARD normal when entering denser medium (higher n)
- Light bends AWAY from normal when entering less dense medium
- Critical angle: sinθc = n₂/n₁ (only when n₁ > n₂, going from denser to less dense)
- Total internal reflection: When θ > θc, all light reflects (fiber optics, diamonds)

MIRRORS:
- Mirror equation: 1/f = 1/dₒ + 1/dᵢ
- Magnification: M = -dᵢ/dₒ = hᵢ/hₒ
- Concave mirror (converging): f > 0, center curves away from you
  - Object beyond C: Real, inverted, smaller
  - Object at C: Real, inverted, same size
  - Object between C and F: Real, inverted, larger
  - Object at F: No image (parallel rays)
  - Object inside F: Virtual, upright, larger
- Convex mirror (diverging): f < 0, center curves toward you
  - Always: Virtual, upright, smaller (car side mirrors)
- Sign conventions: Real image dᵢ > 0, Virtual image dᵢ < 0

LENSES:
- Thin lens equation: 1/f = 1/dₒ + 1/dᵢ (same as mirror equation)
- Converging lens (convex, thicker in middle): f > 0
- Diverging lens (concave, thinner in middle): f < 0
- Lensmaker's equation: 1/f = (n-1)(1/R₁ - 1/R₂)
- Power of lens: P = 1/f (in diopters when f is in meters)
- Converging lens image types same as concave mirror
- Diverging lens: Always virtual, upright, smaller

OPTICAL INSTRUMENTS:
- Magnifying glass: Simple converging lens, object inside F, M = 25cm/f
- Compound microscope: Two converging lenses
  - Objective (short f): Creates real, inverted, magnified image
  - Eyepiece (longer f): Magnifies objective's image
  - Total M = Mobjective × Meyepiece
- Telescope (refracting): Two converging lenses
  - Objective (long f): Creates real, inverted image at focal point
  - Eyepiece (short f): Magnifies objective's image
  - Angular magnification: M = -fₒ/fₑ
- Human eye: Cornea + lens focus on retina, Near point ~25cm, Accommodation adjusts lens

WAVE OPTICS:
- Wave equation: c = fλ (c = 3×10⁸ m/s)
- Interference: Constructive (path difference = nλ), Destructive (path difference = (n+½)λ)
- Double-slit interference (Young's): Bright fringes at d·sinθ = nλ
- Single-slit diffraction: Dark fringes at a·sinθ = nλ
- Thin film interference: Extra phase shift at reflection from higher n medium
- Polarization: Light waves oscillating in one plane

ELECTROMAGNETIC SPECTRUM (low to high frequency/energy, long to short wavelength):
Radio → Microwave → Infrared → VISIBLE (Red-Orange-Yellow-Green-Blue-Violet) → Ultraviolet → X-ray → Gamma
- Visible range: ~400nm (violet) to ~700nm (red)
- E = hf = hc/λ (h = 6.63×10⁻³⁴ J·s, Planck's constant)

COMMON MISTAKES:
- Forgetting sign conventions for mirrors/lenses
- Confusing converging vs diverging
- Mixing up real (can be projected) vs virtual (cannot be projected)
- Getting Snell's Law direction wrong
- Forgetting to measure angles from the normal`,
  'Ornithology': `bird identification, anatomy, flight mechanics, behavior, migration, and classification.

KEY FACTS TO VERIFY:
- Bird orders: Passeriformes (perching birds, largest order ~60%), Anseriformes (ducks/geese), Falconiformes (hawks/eagles), Strigiformes (owls)
- Flight feathers: Primaries (outer wing, thrust), Secondaries (inner wing, lift), Tail feathers (steering)
- Bone adaptations: Hollow bones, fused bones (synsacrum, pygostyle), large sternum (keel for flight muscles)
- Migration: Many use magnetic fields, stars, sun position, landmarks. Flyways: Atlantic, Mississippi, Central, Pacific

COMMON NORTH AMERICAN BIRDS:
- American Robin: Orange breast, gray back, Turdidae family
- Northern Cardinal: Male bright red, female brownish, seed-eating beak
- Blue Jay: Blue with white/black markings, crest, corvid family
- Red-tailed Hawk: Broad wings, red tail (adults), buteo
- Great Horned Owl: Large ear tufts, yellow eyes, powerful talons

FIELD MARKS: Size, shape, color patterns, bill shape, tail shape, behavior, habitat, song

COMMON MISTAKES: Confusing similar species (e.g., hawks vs falcons - falcons have pointed wings, hawks have broad rounded wings).`,
  'Reach for the Stars': `stellar classification, HR diagrams, stellar evolution, deep sky objects, and observational astronomy.

KEY FACTS TO VERIFY:
- Spectral classes (hot to cool): O B A F G K M ("Oh Be A Fine Girl/Guy, Kiss Me") - O is hottest (blue), M is coolest (red)
- HR Diagram: X-axis = temperature (reversed: hot left, cool right), Y-axis = luminosity. Main sequence diagonal, giants upper right, white dwarfs lower left
- Stellar evolution: Nebula → Protostar → Main Sequence → Red Giant → (depends on mass) → White Dwarf/Neutron Star/Black Hole
- Sun is G-type main sequence star (G2V), ~5,778 K surface temperature

DEEP SKY OBJECTS:
- Nebulae: Emission (glowing gas), Reflection (reflects starlight), Dark (blocks light), Planetary (dying star shell)
- Star clusters: Open/Galactic (young, loose, in disk) vs Globular (old, dense, spherical, in halo)
- Galaxies: Spiral (like Milky Way), Elliptical, Irregular (like Magellanic Clouds)

KEY FORMULAS:
- Same as Astronomy (Distance modulus, Wien's Law, Stefan-Boltzmann, etc.)

COMMON MISTAKES: Getting spectral class order wrong. Confusing nebula types.`,
  'Rocks and Minerals': `mineral identification, rock classification, rock cycle, and geological processes.

MOHS HARDNESS SCALE (1-10):
1-Talc, 2-Gypsum, 3-Calcite, 4-Fluorite, 5-Apatite, 6-Orthoclase, 7-Quartz, 8-Topaz, 9-Corundum, 10-Diamond
- Fingernail ~2.5, Copper penny ~3.5, Glass ~5.5, Steel file ~6.5

MINERAL PROPERTIES:
- Luster: Metallic vs Non-metallic (vitreous, pearly, silky, earthy, etc.)
- Cleavage: Breaks along flat planes (mica = 1 direction, halite = 3 at 90°)
- Fracture: Irregular break (quartz = conchoidal/shell-like)
- Streak: Color of powder (often different from mineral color)
- Specific gravity: Density relative to water

ROCK TYPES:
- Igneous: From magma/lava. Intrusive (slow cooling, large crystals - granite) vs Extrusive (fast cooling, small/no crystals - basite)
- Sedimentary: From weathering/deposition. Clastic (sandstone), Chemical (limestone from precipitation), Organic (coal)
- Metamorphic: Changed by heat/pressure. Foliated (slate, schist, gneiss) vs Non-foliated (marble, quartzite)

COMMON MISTAKES: Confusing cleavage vs fracture. Mixing up intrusive vs extrusive igneous rocks.`,
  'Tower': `structural engineering, force analysis, material properties, and structural failure modes.

KEY CONCEPTS TO VERIFY:
- Forces: Tension (pulling apart), Compression (pushing together), Shear (sliding), Torsion (twisting), Bending
- Triangles are the strongest shape (rigid, can't deform without breaking members)
- Trusses distribute loads through triangulated members

STRUCTURAL MEMBERS:
- Beams: Horizontal, resist bending
- Columns: Vertical, resist compression
- Braces: Diagonal, provide stability, resist lateral forces

FAILURE MODES:
- Buckling: Compression member bows outward (longer = more prone to buckling)
- Tensile failure: Pulled apart when stress exceeds strength
- Connection failure: Joints break before members

KEY FORMULAS:
- Stress = Force / Area (σ = F/A)
- Strain = Change in length / Original length (ε = ΔL/L)
- Young's Modulus: E = Stress / Strain (material stiffness)
- Efficiency = Load held / Structure weight

COMMON MISTAKES: Forgetting that thin, long members buckle easily under compression.`,
  'Wind Power': `wind turbine design, energy conversion, Betz limit, and power calculations.

KEY FORMULAS (MUST VERIFY CALCULATIONS):
- Power in wind: P = ½ρAv³ (ρ = air density ~1.225 kg/m³, A = swept area, v = wind speed)
- Swept area: A = πr² (r = blade length)
- Betz Limit: Maximum efficiency = 59.3% (16/27). No turbine can capture more than this!
- Tip Speed Ratio (TSR) = Blade tip speed / Wind speed. Optimal ~6-8 for modern turbines

KEY CONCEPTS:
- Power increases with CUBE of wind speed (double wind = 8× power)
- Power increases with SQUARE of blade length (double length = 4× swept area)
- Higher altitude = stronger, more consistent winds
- Turbine components: Rotor (blades + hub), Nacelle (generator, gearbox), Tower, Foundation

TURBINE TYPES:
- Horizontal Axis (HAWT): Most common, blades face wind, higher efficiency
- Vertical Axis (VAWT): Blades perpendicular to ground, works in any wind direction

COMMON MISTAKES: Forgetting power ∝ v³ (not v or v²). Exceeding Betz limit in efficiency calculations.`,
  'Write It Do It': `technical writing clarity, precision, and following written instructions.

KEY CONCEPTS:
- Writer must describe how to build an object so another person can recreate it
- Doer must follow written instructions exactly without seeing the original
- Clear, unambiguous language is essential

GOOD TECHNICAL WRITING:
- Use specific measurements (not "small" - say "2 cm")
- Define orientation clearly (top, bottom, left, right, front, back)
- Number steps sequentially
- One action per step
- Use consistent terminology throughout
- Avoid pronouns without clear antecedents ("it" - what is "it"?)
- Include reference points ("place piece A 3 cm from the left edge of piece B")

COMMON MISTAKES:
- Assuming the reader can see what you see
- Using vague terms like "attach it here" or "small piece"
- Skipping steps that seem obvious
- Not specifying orientation or direction
- Using inconsistent names for the same parts`,
};

export async function POST(request: NextRequest) {
  // Get user session for tracking (don't let auth failure crash the request)
  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (authError) {
    console.error('Auth error (non-fatal):', authError);
  }

  // Check usage limits for free users
  if (userId) {
    try {
      const subscriptionStatus = await getSubscriptionStatus(userId);

      // Free users have a monthly limit
      if (subscriptionStatus !== 'active') {
        const monthlyUsage = await getUserMonthlyAIGenerations(userId);

        if (monthlyUsage >= FREE_TIER_MONTHLY_LIMIT) {
          return NextResponse.json(
            {
              error: 'Monthly limit reached',
              limitReached: true,
              used: monthlyUsage,
              limit: FREE_TIER_MONTHLY_LIMIT,
              message: `You've used all ${FREE_TIER_MONTHLY_LIMIT} free AI test generations this month. Upgrade to Pro for unlimited access.`,
            },
            { status: 403 }
          );
        }
      }
    } catch (limitError) {
      console.error('Usage limit check error (non-fatal):', limitError);
      // Continue anyway - don't block on limit check failure
    }
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Request body parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const {
      topic,
      questionCount: requestedCount = 10,
      difficulty = 'Regional',
    } = body;

    // Limit question count to avoid timeout (Netlify has 26s limit)
    const questionCount = Math.min(requestedCount, MAX_QUESTIONS_FOR_TIMEOUT);

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const topicDescription = TOPIC_DESCRIPTIONS[topic] || topic.toLowerCase();
    const difficultyDescription = DIFFICULTY_DESCRIPTIONS[difficulty] || difficulty;

    // Enhanced prompt for higher quality questions
    const prompt = `You are an expert Science Olympiad coach creating a Division C practice test for ${topic}.

TOPIC: ${topic}
FOCUS AREAS: ${topicDescription}
DIFFICULTY LEVEL: ${difficulty}
LEVEL DESCRIPTION: ${difficultyDescription}

Generate exactly ${questionCount} high-quality questions following these strict guidelines:

QUESTION QUALITY REQUIREMENTS:
1. Questions must be factually accurate and scientifically precise
2. Use proper scientific terminology and units
3. Questions should test understanding, not just memorization
4. Include a mix of:
   - Recall questions (definitions, identification)
   - Application questions (using concepts in scenarios)
   - Analysis questions (interpreting data, comparing)
5. For ${difficulty} level, ensure appropriate complexity

QUESTION TYPES (aim for ~60% multiple choice, ~40% short answer):

MULTIPLE CHOICE:
- All 4 options should be plausible (no obviously wrong answers)
- Distractors should represent common misconceptions
- Avoid "all of the above" or "none of the above"
- Options should be similar in length and style

SHORT ANSWER:
- Answer should be 1-5 words (concise)
- Provide the most precise accepted answer
- For numerical answers, include units
- Accept common abbreviations in the answer

Return valid JSON:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Clear, specific question with context if needed?",
      "options": ["A) Plausible option 1", "B) Plausible option 2", "C) Plausible option 3", "D) Plausible option 4"],
      "correctAnswer": "B) Plausible option 2",
      "points": 1,
      "category": "${topic}"
    },
    {
      "type": "short-answer",
      "question": "Specific question requiring brief answer?",
      "correctAnswer": "precise answer",
      "points": 2,
      "category": "${topic}"
    }
  ]
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for higher quality questions
      messages: [
        {
          role: 'system',
          content: `You are an expert Science Olympiad coach and test writer with 20+ years of experience. You have deep expertise in ${topic} and understand exactly what makes a good competition question.

CRITICAL REQUIREMENTS:
1. Every question MUST be factually correct - verify your knowledge before generating
2. For multiple choice, the correct answer MUST be among the options
3. All options must be plausible - no obviously wrong answers
4. Questions should test real understanding, not trick students

FACTUAL ACCURACY (VERIFY BEFORE GENERATING):
- Use the KEY FACTS provided in the topic description - these are verified correct
- If stating a specific fact (date, name, number, sequence), double-check it's accurate
- For biological/anatomical questions: verify organ locations, system functions, correct terminology
- For classification questions: verify taxonomic relationships, category memberships
- For process questions: verify the correct sequence of steps
- If you're unsure about a specific fact, use a different question you're confident about

MATHEMATICAL ACCURACY (EXTREMELY IMPORTANT):
- For ANY calculation question, you MUST work through the math step-by-step BEFORE generating the question
- ALWAYS verify unit conversions (e.g., cm to mm, m to cm)
- Double-check that your calculated answer matches one of the multiple choice options
- Show your work mentally: write out the formula, substitute values, calculate step-by-step
- If unsure about a calculation, use simpler numbers that you can verify
- Common error to avoid: forgetting unit conversions (e.g., 4cm = 40mm, not 4mm)

Output valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more accurate, consistent questions
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    // Extract token usage from completion
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;

    // Calculate cost
    const costUsd = (promptTokens / 1000 * PRICE_PER_1K_PROMPT_TOKENS) +
                    (completionTokens / 1000 * PRICE_PER_1K_COMPLETION_TOKENS);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI API');
      // Log failed API call (don't let this crash)
      try {
        await logApiUsage({
          userId,
          endpoint: 'generate-ai-test',
          model: 'gpt-4o',
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd,
          topic,
          difficulty,
          questionCount,
          success: false,
          errorMessage: 'Empty response from API',
        });
      } catch (logError) {
        console.error('Failed to log API usage:', logError);
      }

      return NextResponse.json(
        { error: 'Failed to generate questions - empty response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let questions: Question[];
    try {
      const parsed = JSON.parse(content);

      // Handle both array and object with questions key
      const questionArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        throw new Error('No questions in response');
      }

      // Add IDs to questions
      questions = questionArray.map((q: any) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        category: q.category || topic,
      }));
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError, 'Content:', content?.substring(0, 500));
      return NextResponse.json(
        {
          error: 'Failed to parse generated questions. Please try again.',
          details: parseError?.message || 'JSON parse failed',
          contentPreview: content?.substring(0, 200)
        },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const totalTime = questions.length * 90; // 1.5 minutes per question

    // Create test
    const test: Test = {
      id: generateId(),
      year: new Date().getFullYear(),
      title: `AI Generated: ${topic} Practice Test`,
      description: `AI-generated practice test with ${questions.length} questions for ${topic}. Questions are AI-generated and should be verified for accuracy.`,
      difficulty,
      totalTime,
      totalPoints,
      topic,
      questions,
    };

    // Save to database (don't let DB failure crash the response)
    try {
      await saveTest(test);
    } catch (dbError) {
      console.error('Database save error (non-fatal):', dbError);
      // Continue anyway - user still gets the test
    }

    // Log successful API usage (don't let logging failure crash the response)
    try {
      await logApiUsage({
        userId,
        endpoint: 'generate-ai-test',
        model: 'gpt-4o',
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        topic,
        difficulty,
        questionCount: questions.length,
        success: true,
      });
    } catch (logError) {
      console.error('API usage logging error (non-fatal):', logError);
    }

    return NextResponse.json({
      success: true,
      test,
      questionCount: questions.length,
      totalPoints,
      totalTime,
      aiGenerated: true,
      disclaimer: 'Questions are AI-generated. Verify answers before using for serious practice.',
    });
  } catch (error: any) {
    console.error('AI generation error:', error);

    // Handle specific OpenAI API errors
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (error?.code === 'insufficient_quota' || error?.status === 402) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 402 }
      );
    }

    if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'The AI model is not available. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate test',
        details: error?.message || (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

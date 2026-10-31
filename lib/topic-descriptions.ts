// Shared topic and difficulty descriptions for AI test generation
// Used by both generate-ai-test and generate-from-pdf routes

// Competition level difficulty descriptions with specific requirements
export const DIFFICULTY_DESCRIPTIONS: Record<string, string> = {
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

export const TOPIC_DESCRIPTIONS: Record<string, string> = {
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
- Low mass (<0.5 M☉): Main-sequence lifetime exceeds the age of the universe, so none have evolved off it yet. The lowest-mass stars (≲0.25 M☉) are predicted to skip the red giant phase and fade into helium white dwarfs.
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
  'Botany': `plant biology for the 2027 season: plant structure, physiology, reproduction, taxonomy, evolution, and the roles of plants in ecosystems and society.

EVENT FOCUS 2027:
- Brand-new event for 2027 in BOTH Division B and Division C
- Run as a sit-down exam or lab stations with specimens, pictures, data, microscopes, and slides
- Know the major divisions between plant groups: algae vs. multicellular plants, monocot vs. dicot, embryophytes vs. cryptogams, woody vs. herbaceous

PLANT STRUCTURE:
- Roots: absorption + anchorage; root hairs increase surface area; taproot vs. fibrous
- Stems: support + transport; nodes/internodes; meristems (apical = primary growth, lateral = secondary growth)
- Leaves: photosynthetic organs; blade, petiole, veins; guard cells regulate stomata for gas exchange
- Xylem carries water + minerals UP from roots (dead, hollow cells); phloem carries sugars BOTH directions (living cells) - source to sink
- Dermal, ground, and vascular tissue systems

PHOTOSYNTHESIS AND RESPIRATION:
- Overall: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
- Light reactions in thylakoid membrane: split water → O₂, produce ATP + NADPH
- Calvin cycle in stroma: RuBisCO fixes CO₂ into 3-carbon sugars (C₃)
- Photorespiration waste led to C₄ (bundle sheath concentration, e.g., corn) and CAM (nighttime CO₂ uptake, e.g., cacti) adaptations
- Transpiration: evaporation from leaves pulls water up (cohesion-tension); guard cells open/close stomata

REPRODUCTION AND LIFE CYCLES:
- Alternation of generations: gametophyte (n) alternates with sporophyte (2n)
- Bryophytes (mosses): gametophyte dominant, sperm need water to swim
- Ferns: sporophyte dominant, spores, free-swimming sperm, independent gametophyte (prothallus)
- Gymnosperms: naked seeds in cones, pollen eliminates need for water
- Angiosperms: flowers + fruit; double fertilization makes 2n zygote + 3n endosperm
- Flower parts: stamen (anther + filament), pistil/carpel (stigma, style, ovary), petals, sepals
- Pollination vectors: wind, insects, birds, water; coevolution of flowers and pollinators

PLANT DIVERSITY AND TAXONOMY:
- Green algae (Charophytes): closest relatives of land plants
- Nonvascular bryophytes: mosses, liverworts, hornworts - no true xylem/phloem
- Seedless vascular: ferns, club mosses, horsetails
- Gymnosperms: conifers (pines), cycads, ginkgo, gnetophytes
- Angiosperms: monocots (one cotyledon, parallel veins, fibrous roots, scattered vascular bundles, flower parts in 3s) vs. dicots/eudicots (two cotyledons, net veins, taproot, vascular in a ring, flower parts in 4s or 5s)

PLANT HORMONES:
- Auxin: cell elongation, apical dominance, phototropism (bends toward light)
- Gibberellins: stem elongation, seed germination
- Cytokinins: cell division, delay senescence
- Ethylene: gas hormone, fruit ripening, leaf abscission
- Abscisic acid (ABA): dormancy, closes stomata under drought stress

EVOLUTION AND PALEOBOTANY:
- Land plants from green algae ~450-475 mya; major innovations in order: vascular tissue → seeds → flowers
- Cooksonia: early vascular plant; Archaeopteris: early tree
- Coal forests of Carboniferous (lycopods, ferns); angiosperm radiation in Cretaceous
- Know major plant-derived fossils and what they tell us about ancient climates

ROLE OF PLANTS:
- Primary producers: base of most food webs, oxygen production, carbon fixation
- Agriculture, medicines, materials; conservation concerns (invasives, habitat loss)
- Symbioses: mycorrhizae (fungi + roots, aid absorption), nitrogen-fixing bacteria in legume root nodules, lichens

COMMON MISTAKES:
- Mixing up xylem vs. phloem direction and cell type
- Assuming algae are plants (most algae are protists; only green algae share a common ancestor with plants)
- Confusing gametophyte vs. sporophyte dominance across groups
- Putting monocot and dicot traits in the wrong columns`,
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
  'Circuit Lab': `electricity and electronics for the 2027 season: circuit analysis, Ohm's law, power, components, and electromagnetism, with hands-on lab tasks plus written questions.

EVENT FORMAT 2027:
- Both Division B and Division C; hands-on tasks AND written questions about electricity and electronics
- Expect breadboard or draw-and-analyze circuit tasks, multimeter readings, and calculation problems

KEY FORMULAS (VERIFY ALL CALCULATIONS):
- Ohm's law: V = IR (voltage in volts, current in amps, resistance in ohms)
- Power: P = VI = I²R = V²/R; energy: E = Pt (kWh on electric bills)
- Series resistors: R_total = R₁ + R₂ + ...; Parallel: 1/R_total = 1/R₁ + 1/R₂ + ...
- Two in parallel: R_eq = (R₁×R₂)/(R₁+R₂); N identical in parallel: R/N
- Charge: Q = CV; capacitor energy: E = ½CV²
- Capacitors: parallel add (C₁+C₂); series combine like parallel resistors
- Kirchhoff's junction rule: current in = current out at a node
- Kirchhoff's loop rule: sum of voltage changes around any loop = 0
- RC time constant: τ = RC (charging/discharging)

SERIES VS PARALLEL RULES:
- Series: same current everywhere; voltages divide proportionally to resistance
- Parallel: same voltage across branches; currents divide (more current through less resistance)
- Adding a resistor in series raises total resistance; adding in parallel lowers it
- Broken series path kills the whole circuit; one broken parallel branch leaves others on (house wiring is parallel)

COMPONENTS AND MEASUREMENT:
- Resistor: opposes current; color code bands (black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, gray 8, white 9)
- Capacitor: stores charge/energy in an electric field; blocks steady DC, passes changing signals
- Battery/cell: source of EMF; diode/LED: one-way current (LED in forward bias)
- Switch: opens/closes path; potentiometer: variable resistor
- Voltmeter: connect in PARALLEL (high internal resistance); ammeter: connect in SERIES (very low resistance)
- Multimeter modes: voltage, current, resistance (circuit must be off/dead for resistance)

MAGNETISM AND ELECTROMAGNETISM:
- Current creates a magnetic field (right-hand rule: thumb = current, fingers = field circles)
- Solenoid/electromagnet: coiled wire + core; strength up with turns, current, iron core
- Faraday's law: changing magnetic flux induces EMF; faster change or more turns = more EMF
- Motors: current + field → torque (electrical → mechanical); Generators: motion + field → current (mechanical → electrical)
- Transformers: AC only; V_s/V_p = N_s/N_p

AC VS DC:
- DC: constant direction (batteries); AC: reverses direction (US household 120 V RMS, 60 Hz)
- RMS voltage × current = average power; peak = √2 × RMS for sine waves

COMMON MISTAKES:
- Adding parallel resistances instead of using reciprocals
- Putting an ammeter in parallel (short circuit) or voltmeter in series (reads nearly full supply voltage)
- Forgetting unit conversions (mA → A, kΩ → Ω) before plugging into formulas
- Applying series current rule to parallel branches or vice versa
- Misreading resistor color bands in the wrong direction (tolerance band last)`,
  'Codebusters': `cryptanalysis for the 2027 season: decoding messages encrypted with historical and modern ciphers, from Caesar shifts to RSA.

EVENT FORMAT 2027:
- Both Division B and Division C
- Question types: timed question (bonus for first correct decode), questions worth varying points, and unlimited-time sections
- Decoders allowed: one binder or sheet per rules; calculators per rules

MONOALPHABETIC SUBSTITUTION CIPHERS:
- Caesar (shift): each letter shifted by fixed amount; 25 possible keys, brute-forceable
- Atbash: A↔Z, B↔Y reversal (its own inverse)
- Affine: x → (ax + b) mod 26; 'a' must be coprime with 26; encrypt letter numbers A=0...Z=25
- Aristocrat: substitution with word spacing kept; Patristocrat: no spacing (harder)
- Keyword/mixed alphabet: keyword letters first, unused letters follow
- Decode with frequency analysis: English letter order approx ETAOIN SHRDLU; most common digraph TH; common short words A, I, THE, AND

POLYALPHABETIC AND KEY CIPHERS:
- Vigenère: keyword picks shifted alphabets via tabula recta; key advances only on plaintext LETTERS (spaces are skipped under SO rules); decryption = shift backward by key letter
- Letter 1 of plaintext uses letter 1 of keyword; keyword repeats when exhausted
- Vigenère defeats naive frequency analysis until key length is found (Kasiski examination)

ENCODING SYSTEMS:
- Morse code: dots/dashes; E = single dot, T = single dash, SOS = ··· ··· ··· ; short words have short codes
- Binary: base 2; ASCII/letters mapped to bit strings; converting binary ↔ decimal
- Baconian: 5-bit groups (A = aaaaa, B = aaaba, ...); any two symbols work (font faces, positions)
- Pigpen/Masonic: symbols from grid shapes
- Xenocrypt: cipher in SPANISH - know Spanish letter frequencies (E, A, O most common) and common words (DE, LA, EL, QUE, EN)

MATH AND MODERN CIPHERS (STATE/NATIONAL):
- Modular arithmetic: clock math; 27 mod 26 = 1
- Division algorithm and inverses mod 26 (e.g., 3×9 = 27 ≡ 1, so 9 is the inverse of 3)
- Hill cipher: matrix multiplication mod 26
- RSA: public key (n, e); encryption c = m^e mod n; security rests on difficulty of factoring n = p×q; d is the private exponent with e·d ≡ 1 mod φ(n)
- One-time pad: key as long as message, used once = unbreakable in principle

COMMON MISTAKES:
- Letting the Vigenère key advance on spaces (SO convention: skip spaces)
- Using A=1 instead of A=0 in affine and Hill ciphers (SO uses A=0 convention)
- Forgetting the affine multiplier must be coprime to 26 (a = 2, 4, 6... are invalid)
- Transcribing Morse with wrong spacing or forgetting 5-bit grouping in Baconian
- Giving up on Aristocrats without writing out letter counts first`,
  'Crime Busters': `forensic qualitative analysis for Division B: identifying unknown powders, liquids, fibers, and other evidence from a crime scenario, then matching results to suspects.

EVENT FORMAT 2027:
- Given a scenario, evidence collection, and possible suspects
- Teams run a series of tests; results + other evidence solve the crime and answer questions
- Division B counterpart to Division C Forensics; Know the evidence types below cold

POWDER ANALYSIS (CLASSIC SO LIST):
- Baking soda (sodium bicarbonate): fizzes with vinegar/HCl; soluble-ish; pH ~8
- Baking powder: fizzes with WATER (contains built-in acid + base); contains cornstarch
- Cornstarch: turns blue-black/purple with iodine; makes a squeaky paste with water
- Flour: partial iodine reaction (lighter); contains gluten protein
- Sugar (sucrose): soluble, no iodine reaction, caramelizes/browns with heat, no fizz
- Salt (NaCl): soluble, no reactions with iodine/vinegar; crystalline cubes
- Plaster of Paris: hardens with water, not very soluble
- Epsom salt (MgSO₄): bitter, crystalline needles, soluble
- Tests to run: appearance/texture, water solubility, pH, vinegar (fizz = carbonate), iodine (starch), heat behavior (melt, char, smell)

LIQUID ANALYSIS:
- Water, vinegar (acidic pH ~2.5, smell), iodine solution itself, alcohol (evaporates fast, cool feeling), hydrogen peroxide (bubbles on organic material/wounds), unknown samples
- Use pH paper/indicators; never taste; waft smells

FIBERS AND HAIR:
- Cotton: cellulose, burns like paper, smells like burning paper, leaves gray ash
- Wool: protein (keratin), smells like burnt hair, self-extinguishes, black crispy ash
- Silk: protein, burnt-hair smell but smoother burn
- Nylon/polyester: synthetic, melts into beads, chemical/sweet smell
- Hair: medulla patterns, root types; human vs. animal (scale patterns)

OTHER EVIDENCE:
- Chromatography: separate ink pigments by capillary action; Rf = distance spot moved / distance solvent moved; match pens by pattern
- Fingerprints: loop (most common), whorl, arch; match minutiae (ridge endings, bifurcations)
- DNA, shoe prints/tire tracks: matching by class + individual characteristics

COMMON MISTAKES:
- Baking soda vs. baking powder: powder fizzes with just water; soda needs an acid
- Cornstarch vs. flour with iodine: starch goes blue-black, flour only pale
- Wool vs. cotton burn tests: paper smell = cellulose (cotton); burnt hair = protein (wool/silk)
- Testing powders in a random order instead of running all observations on each unknown systematically`,
  'Designer Genes': `classic, evolutionary, and molecular genetics at the Division C level: inheritance, gene regulation, biotechnology, and population genetics.

EVENT SCOPE 2027 (DIVISION C):
- Classic genetics, evolutionary genetics, AND molecular genetics - broader than Division B Heredity
- Expect pedigree analysis, molecular mechanisms, data analysis, and multi-concept problems

MENDELIAN GENETICS:
- Law of segregation: alleles separate into separate gametes; law of independent assortment: genes on different chromosomes sort independently
- Monohybrid cross Aa × Aa → 3:1 phenotype; dihybrid AaBb × AaBb → 9:3:3:1
- Testcross (with homozygous recessive) reveals an unknown genotype
- Probability: product rule (AND, independent events) and sum rule (OR, mutually exclusive)
- Chi-square test for goodness of fit: χ² = Σ(observed - expected)²/expected; reject null if χ² exceeds critical value

EXTENSIONS OF MENDELIAN:
- Incomplete dominance (red × white → pink) vs. codominance (both alleles expressed, AB blood, roan cattle)
- Multiple alleles: ABO blood (I^A, I^B codominant; i recessive); H substance required
- Epistasis: one gene masks another (9:3:4, 12:3:1, 9:7 ratios)
- Lethal alleles (2:1 surviving ratios); pleiotropy (one gene, many effects, e.g., sickle cell)
- Polygenic traits + environment = continuous variation (skin color, height)
- Linkage: genes on the same chromosome inherited together; crossing over breaks linkage
- Gene mapping: 1 map unit (centimorgan) = 1% recombination frequency; map distances approximately add
- Sex-linked: X-linked recessive (males affected more), X-linked dominant, Y-linked

PEDIGREES:
- Autosomal recessive: skips generations, carriers; unaffected parents can have affected children
- Autosomal dominant: every affected child has an affected parent; no skipping
- X-linked recessive: affected fathers pass to daughters (carriers) not sons; carrier mothers → affected sons
- Mitochondrial: maternal inheritance only

MOLECULAR GENETICS:
- DNA: antiparallel double helix, A=T (2 H-bonds), G≡C (3 H-bonds); semiconservative replication
- Replication enzymes: helicase (unzip), primase (RNA primer), DNA polymerase (5'→3' synthesis), ligase (join Okazaki fragments)
- Central dogma: DNA → (transcription, RNA polymerase) → mRNA → (translation, ribosome) → protein
- Genetic code: triplet codons, 64 codons, AUG start, stop codons UAA/UAG/UGA; degenerate but unambiguous
- Mutations: point (silent, missense, nonsense) vs. frameshift (insertion/deletion not multiples of 3)
- Gene regulation: lac operon (inducible, allolactose removes repressor), trp operon (repressible), eukaryotic enhancers/transcription factors, epigenetics (methylation, histone modification)

BIOTECHNOLOGY:
- PCR: cycles of denaturation, annealing, extension; amplifies DNA exponentially
- Gel electrophoresis: DNA negative → runs to + electrode; small fragments move fastest/farthest
- Restriction enzymes cut at palindromic sites; sticky ends; recombinant plasmids
- CRISPR-Cas9: guide RNA + nuclease for targeted cuts; uses: editing, knockouts
- Applications: DNA fingerprinting (paternity, forensics), GMOs, gene therapy

POPULATION AND EVOLUTIONARY GENETICS:
- Hardy-Weinberg equilibrium: p² + 2pq + q² = 1 (p + q = 1); assumes no selection, mutation, migration, drift, or nonrandom mating
- q² = recessive homozygote frequency; q = √(affected frequency); carriers = 2pq
- Selection types: directional, stabilizing, disruptive; heterozygote advantage (sickle cell vs. malaria)
- Genetic drift (bottleneck, founder effect) vs. gene flow; fitness = reproductive success

COMMON MISTAKES:
- Taking q² as allele frequency instead of taking the square root first
- Confusing codominance (both phenotypes visible) with incomplete dominance (blend)
- Frameshift vs. nonsense mutation classification
- Assuming linked genes assort independently (only unlinked ones do)
- Reading gels backward (largest fragments at the wells)`,
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

EARTH'S STRUCTURE:
- Crust: Thin outer layer (5-70 km)
  - Oceanic crust: Thinner (~7 km), denser (basalt), younger
  - Continental crust: Thicker (~35 km), less dense (granite), older
- Mantle: 2,900 km thick, solid but flows slowly (convection)
  - Lithosphere: Rigid upper mantle + crust (~100 km)
  - Asthenosphere: Partially molten, plates float on this
- Outer Core: Liquid iron/nickel, 2,200 km thick, generates magnetic field
- Inner Core: Solid iron/nickel, ~1,200 km radius, hottest part (~5,400°C)
- How we know: Seismic waves (S-waves can't go through liquid outer core)

PLATE TECTONICS:
- Plates float on asthenosphere, driven by mantle convection
- Divergent boundaries: Plates move apart
  - Mid-ocean ridges (new seafloor), Rift valleys (East Africa)
  - Seafloor spreading: Youngest rock at ridge, older away
- Convergent boundaries: Plates collide
  - Ocean-ocean: Subduction, volcanic island arc (Japan)
  - Ocean-continent: Subduction, coastal volcanoes (Andes)
  - Continent-continent: Mountains, no subduction (Himalayas)
- Transform boundaries: Plates slide past
  - Earthquakes, no volcanoes (San Andreas Fault)
- Hot spots: Stationary magma plumes, chains of volcanoes (Hawaii)
- Evidence for plate tectonics:
  - Continental fit (Africa + South America)
  - Fossil distribution (same fossils on separated continents)
  - Magnetic striping (symmetric pattern at mid-ocean ridges)
  - Earthquake/volcano distribution (along plate boundaries)

EARTHQUAKES:
- Focus: Point where rupture begins (underground)
- Epicenter: Point on surface directly above focus
- Seismic waves:
  - P-waves (Primary): Fastest, compressional (push-pull), travel through solids AND liquids
  - S-waves (Secondary): Slower, shear (side-to-side), only through solids (NOT liquids)
  - Surface waves (Love, Rayleigh): Slowest, most destructive, travel along surface
- Magnitude scales:
  - Richter: Logarithmic! Each whole number = 10× amplitude, ~32× energy
  - Moment magnitude: More accurate for large quakes
- Intensity: Mercalli scale (I-XII), measures damage/felt effects
- Seismograph: Records seismic waves, uses P-S time difference to locate epicenter
- Locating epicenter: Need 3+ seismograph stations, triangulation

VOLCANOES:
- Magma: Molten rock underground. Lava: Molten rock at surface
- Magma types:
  - Basaltic: Low silica, low viscosity, flows easily, less explosive
  - Andesitic: Medium silica, medium viscosity
  - Rhyolitic: High silica, high viscosity, very explosive
- Volcano types:
  - Shield: Gentle slopes, basaltic, effusive eruptions (Hawaii, Mars)
  - Stratovolcano (composite): Steep, alternating lava/ash, explosive (Mt. St. Helens, Fuji)
  - Cinder cone: Smallest, steep, pyroclastic material
  - Caldera: Large crater from collapse after massive eruption (Yellowstone)
- Volcanic hazards: Lava flows, Pyroclastic flows, Lahars (mudflows), Ash fall, Gases

WEATHERING & EROSION:
- Weathering: Breaking down rock in place
  - Mechanical/Physical: Frost wedging, Root growth, Thermal expansion, Abrasion
  - Chemical: Dissolution, Oxidation (rust), Hydrolysis, Acid rain
- Erosion: Transport of weathered material by water, wind, ice, gravity
- Deposition: Material settles out when energy decreases
- Mass wasting: Gravity-driven movement (landslides, rockfalls, creep)
- Stream features: V-shaped valleys, Meanders, Oxbow lakes, Deltas, Alluvial fans
- Glacial features: U-shaped valleys, Moraines, Cirques, Drumlins, Erratics

ROCK CYCLE:
- Igneous → (weathering/erosion) → Sediments → (compaction/cementation) → Sedimentary
- Sedimentary → (heat/pressure) → Metamorphic
- Any rock → (melting) → Magma → (cooling) → Igneous
- Any rock can become any other type through the right processes

COMMON MISTAKES:
- Confusing P-waves (through liquids) and S-waves (NOT through liquids)
- Forgetting Richter scale is logarithmic
- Mixing up magma (underground) and lava (surface)
- Confusing weathering (in place) and erosion (transport)`,
  'Ecology': `population dynamics, community interactions, energy flow, nutrient cycles, biomes, and succession.

ENERGY FLOW:
- Producers (autotrophs): Make own food via photosynthesis, base of food chain
- Consumers (heterotrophs): Primary (herbivores), Secondary (carnivores eat herbivores), Tertiary (top predators)
- Decomposers: Bacteria and fungi, break down dead matter, recycle nutrients
- 10% Rule: Only ~10% of energy transfers to next trophic level (rest lost as heat)
- Food chain: Linear path of energy (grass → rabbit → fox)
- Food web: Complex interconnected food chains
- Trophic pyramid: Energy, biomass, or numbers decrease going up levels
- Gross Primary Productivity (GPP): Total energy captured by producers
- Net Primary Productivity (NPP): GPP - respiration = energy available to consumers

POPULATION DYNAMICS:
- Population: Same species in same area at same time
- Density: Number of individuals per unit area
- Exponential growth: dN/dt = rN (J-curve, unlimited resources)
- Logistic growth: dN/dt = rN(K-N)/K (S-curve, limited resources)
  - K = carrying capacity (maximum sustainable population)
  - r = intrinsic growth rate
- Density-dependent factors: Competition, predation, disease (effects increase with density)
- Density-independent factors: Weather, natural disasters (effects don't depend on density)
- r-selected species: Many offspring, little care, short-lived (insects, bacteria)
- K-selected species: Few offspring, much care, long-lived (elephants, humans)
- Survivorship curves: Type I (low early death), Type II (constant), Type III (high early death)

SPECIES INTERACTIONS:
- Mutualism (+/+): Both benefit (bee + flower, mycorrhizae + plant)
- Commensalism (+/0): One benefits, other unaffected (barnacles on whale)
- Parasitism (+/-): Parasite benefits, host harmed (tapeworm in intestine)
- Predation (+/-): Predator benefits, prey killed
- Competition (-/-): Both harmed, fighting for resources
  - Interspecific: Between different species
  - Intraspecific: Within same species (usually more intense)
- Competitive exclusion principle: Two species can't occupy same niche indefinitely
- Niche: Role of species in ecosystem (what it eats, where it lives, when active)
- Keystone species: Disproportionate impact on ecosystem relative to abundance

SUCCESSION:
- Primary succession: Starts on bare rock/new land, no soil (volcanic island, glacier retreat)
  - Pioneer species: Lichens, mosses → grasses → shrubs → trees
  - Very slow (hundreds of years)
- Secondary succession: After disturbance, soil remains (forest fire, abandoned farm)
  - Faster than primary (decades)
- Climax community: Stable end-point of succession
- Pioneer species: First colonizers, tolerant of harsh conditions

NUTRIENT CYCLES:
- Carbon cycle:
  - Photosynthesis removes CO₂ from atmosphere
  - Respiration, decomposition, combustion release CO₂
  - Fossil fuels store carbon long-term
- Nitrogen cycle:
  - N₂ (78% of atmosphere) → NH₃ (nitrogen fixation by bacteria, lightning)
  - NH₃ → NO₂⁻ → NO₃⁻ (nitrification by bacteria)
  - NO₃⁻ → N₂ (denitrification by bacteria)
  - Plants absorb NO₃⁻ or NH₄⁺
- Phosphorus cycle: No atmospheric component, from rocks, limiting nutrient
- Water cycle: Evaporation → Condensation → Precipitation → Runoff/infiltration

BIOMES (terrestrial):
- Tundra: Coldest, permafrost, low biodiversity, Arctic
- Taiga (Boreal forest): Largest biome, coniferous trees, cold winters
- Temperate deciduous forest: Four seasons, deciduous trees
- Temperate grassland: Hot summers, cold winters, prairies
- Desert: <25cm rain/year, hot or cold, high temp variation
- Tropical rainforest: Most biodiversity, warm year-round, high rainfall
- Savanna: Tropical grassland with scattered trees

AQUATIC BIOMES:
- Freshwater: Lakes, ponds, rivers, streams, wetlands
- Marine: Ocean zones - Intertidal, Neritic (continental shelf), Oceanic, Benthic (bottom)
- Estuary: Where freshwater meets saltwater, very productive

COMMON MISTAKES:
- Confusing primary vs secondary succession
- Forgetting 10% rule for energy transfer
- Mixing up r-selected and K-selected species
- Confusing niche vs habitat`,
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

POPULATION & DEMOGRAPHICS:
- US population: ~330 million (3.3×10⁸)
- World population: ~8 billion (8×10⁹)
- US households: ~130 million
- US land area: ~3.8 million mi² = ~10 million km²
- World land area: ~150 million km² (57 million mi²)
- Average US household: ~2.5 people
- Average human lifespan: ~80 years
- Human heartbeats: ~100,000/day, ~1/second at rest
- Human breaths: ~20,000/day
- Births per year (world): ~140 million
- Deaths per year (world): ~60 million

PHYSICAL CONSTANTS:
- Speed of light: c = 3×10⁸ m/s
- Speed of sound (air): ~340 m/s = ~1,100 ft/s
- Gravitational acceleration: g = 10 m/s² (for estimation)
- Earth radius: ~6,400 km = ~4,000 miles
- Earth circumference: ~40,000 km = ~25,000 miles
- Earth-Sun distance: ~150 million km = 1 AU = 8 light-minutes
- Earth-Moon distance: ~400,000 km = ~240,000 miles
- Moon radius: ~1,700 km (about 1/4 Earth)
- Sun radius: ~700,000 km (about 100× Earth)

DENSITIES & MASSES:
- Water: 1 g/cm³ = 1 kg/L = 1000 kg/m³
- Air (sea level): ~1.2 kg/m³
- Iron/Steel: ~8 g/cm³
- Wood: ~0.5-1 g/cm³
- Human body: ~1 g/cm³ (we barely float)
- Earth mass: ~6×10²⁴ kg
- Sun mass: ~2×10³⁰ kg

TIME CONVERSIONS:
- 1 minute = 60 seconds
- 1 hour = 3,600 seconds = 60 minutes
- 1 day = 86,400 seconds ≈ 10⁵ seconds
- 1 year ≈ π×10⁷ seconds ≈ 3.15×10⁷ seconds
- 1 year = 365.25 days = 8,766 hours = 525,960 minutes

LENGTH CONVERSIONS:
- 1 inch = 2.54 cm
- 1 foot = 30 cm = 0.3 m
- 1 yard = 0.9 m ≈ 1 m
- 1 mile = 1.6 km = 5,280 feet
- 1 meter = 3.3 feet
- Human height: ~1.7 m = ~5.5 feet
- Human arm span ≈ height

VOLUME CONVERSIONS:
- 1 gallon = 3.8 L ≈ 4 L
- 1 liter = 1000 cm³ = 10⁻³ m³
- 1 cup = ~250 mL
- Olympic swimming pool: ~2.5 million liters

EVERYDAY OBJECTS:
- Car: ~2,000 kg = ~4,000 lbs
- Car length: ~4-5 m
- School bus: ~10 m long
- Football field: 100 yards ≈ 100 m
- Classroom: ~10m × 10m = 100 m²
- Sheet of paper: ~0.1 mm thick
- Human hair: ~0.1 mm diameter
- Dollar bill: ~15 cm × 6 cm

ESTIMATION TECHNIQUES:
1. Break into smaller parts (divide and conquer)
2. Round to powers of 10
3. Use dimensional analysis (check units cancel)
4. Geometric mean for ranges: √(low × high)
5. Sanity check your answer
6. Work from what you know to what you don't

EXAMPLE PROBLEM:
"How many piano tuners in Chicago?"
- Chicago population: ~3 million
- People per household: ~2.5 → ~1.2 million households
- Households with piano: ~5% → ~60,000 pianos
- Tunings per year per piano: ~2 → ~120,000 tunings/year
- Tunings per tuner per day: ~4 → ~1,000/year per tuner
- Piano tuners needed: ~120,000 / 1,000 = ~120 tuners

COMMON MISTAKES:
- Forgetting unit conversions
- Not breaking complex problems into simpler parts
- Using wrong order of magnitude
- Not checking if answer is reasonable
- Forgetting factors of π or 2 that matter at order of magnitude`,
  'Food Science': `dairy food science for the 2027 season: milk composition, dairy carbohydrates, lipids, and proteins, food preservation, and cultured dairy products.

EVENT FOCUS 2027 (DAIRY):
- Division B event; written test topics are limited to dairy food science
- Lab tasks: ice cream formation (freezing point depression), curd mass (acid coagulation of casein), butter from cream (emulsion inversion)
- Everything tested centers on milk and products made from it

MILK COMPOSITION (KEY NUMBERS):
- Whole cow's milk: ~87-88% water, ~3.25% fat, ~4.8% lactose, ~3.3% total protein, ~0.7% minerals
- Four major components: water, fat, protein, lactose (minerals are the smaller fifth)
- Protein split: ~80% casein (2.6%), ~20% whey (0.6%)
- pH 6.6-6.7 (slightly acidic), density ~1.03 g/mL, freezing point ~-0.53 °C
- Milk is three mixtures at once: true solution (lactose, salts, water-soluble vitamins), colloidal dispersion (casein micelles ~0.1 µm, scatter light → white), emulsion (fat globules 1-10 µm)
- One cup (240 mL) of milk at any fat level: ~8 g protein, ~12 g lactose, ~300 mg calcium
- Sheep milk: highest fat/protein (best cheese yield per liter); human milk: more lactose, less protein than cow's

CARBOHYDRATES IN DAIRY:
- Lactose = glucose + galactose joined by a glycosidic bond (disaccharide)
- Lactose is synthesized only in the mammary gland; least sweet of common sugars
- Lactase enzyme hydrolyzes lactose (hydrolysis = add water to split; opposite of dehydration synthesis)
- Lactose crystallization causes "sandy" defect in ice cream

LIPIDS:
- Triglyceride = glycerol + 3 fatty acids joined by ester bonds (esterification = dehydration synthesis)
- Saturated fats: no C=C double bonds, straight chains, solid at room temperature (palmitic, stearic, myristic)
- Unsaturated fats: one or more C=C, kinked chains, liquid at room temperature (oleic = most common unsaturated in milk fat)
- Most abundant fatty acid in milk fat: PALMITIC (~30%); characteristic/unique fatty acid: BUTYRIC (~3-4%, gives rancid butter its smell)
- Essential fatty acids (body cannot make): linoleic (omega-6) and alpha-linolenic (omega-3)
- Hydrogenation adds H to double bonds → semisolid fats, creates trans fats
- Fat = 9 kcal/g (more than double carbs/protein at 4 kcal/g)
- Milk fat globule membrane: phospholipid + protein wrapper that keeps fat emulsified

PROTEINS - CASEIN AND WHEY:
- Casein (~80% of milk protein): forms micelles held together by calcium phosphate, with a "hairy" κ-casein layer keeping micelles apart
- At pH ~6.7 casein micelles are negatively charged and repel; adding acid neutralizes charge
- CASEIN ISOELECTRIC POINT = pH 4.6: no net charge → micelles clump into a gel → CURDS; leftover liquid = WHEY
- Whey proteins (lactalbumin, lactoglobulin) stay soluble at pH 4.6 but denature with heat
- Rennet enzyme (chymosin) cuts off κ-casein → firmer, springier curds (used in cheesemaking)
- Nitrogen is the element in proteins but not carbs/fats; peptide bonds join amino acids (4 kcal/g)
- Kjeldahl method measures protein via nitrogen (N × 6.38 for dairy)

FREEZING POINT DEPRESSION (ICE CREAM):
- Colligative property: depends on NUMBER of dissolved particles, not their identity
- ΔTf = i × Kf × m, where Kf(water) = 1.86 °C·kg/mol, m = molality, i = van 't Hoff factor
- i values: sucrose = 1, NaCl ≈ 2, CaCl₂ ≈ 3
- Salt + ice forms brine below 0 °C (melting ice absorbs heat of fusion ~334 J/g); NaCl brine eutectic ≈ -21 °C
- Dissolved sugar/lactose lower the mix's freezing point (~-1 °C), so plain 0 °C ice cannot freeze it
- Fast freezing + shaking → many small ice crystals (smooth); slow freezing → few large crystals (icy)
- Ice cream = frozen foam: ice crystals + air cells + partially coalesced fat network + unfrozen syrup
- Overrun = (V_icecream - V_mix)/V_mix × 100%; standard ice cream ~100% overrun, premium 25-50%

EMULSIFICATION (BUTTER AND CREAM):
- Milk and cream = oil-in-water (O/W) emulsions; butter = water-in-oil (W/O) - churning INVERTS the emulsion
- Churning/shaking: air whipped in → fat globules collide at bubble surfaces → membranes strip → partial coalescence → butter grains + buttermilk
- Cream whips best at ~13 °C (some fat solid, some liquid); stages: liquid → soft foam → whipped cream → over-whipped → butter + buttermilk
- US cream standards: half-and-half 10.5-18% fat, light cream 18-30%, light whipping 30-36%, heavy cream ≥36%
- Butter: ≥80% milkfat, ~16-18% water; salting (1-2%) lowers water activity in droplets
- Emulsifiers (lecithin) stabilize emulsions; phospholipids have polar + nonpolar ends
- Ghee/clarified butter: water and milk solids removed → higher smoke point, longer keeping

PASTEURIZATION AND PRESERVATION:
- Pasteurization kills pathogens: HTST = 72 °C for 15 s; batch/LTLT = 63 °C for 30 min; UHT = 135 °C for 2-5 s (sterile, shelf-stable)
- Alkaline phosphatase test verifies pasteurization (enzyme destroyed by heat)
- Homogenization: pressure breaks fat globules into smaller ones (done warm so fat is liquid) → no cream layer
- Processing order: receiving/cooling → clarification → separation → standardization (Pearson square) → homogenization → pasteurization → cooling → packaging
- Vitamins A and D added before pasteurization (D fortification began 1930s, ended rickets)
- Preservation methods: refrigeration, drying (powdered milk), condensing with sugar (Borden, 1856), fermentation, salting, freezing
- FAT TOM (bacterial growth): Food, Acidity, Temperature, Time, Oxygen, Moisture; danger zone 4-60 °C (40-140 °F)
- Water activity (aw): lower aw = less microbial growth

CULTURED DAIRY AND PROBIOTICS:
- Yogurt cultures: Streptococcus thermophilus + Lactobacillus delbrueckii subsp. bulgaricus (grow symbiotically)
- Lactic acid bacteria ferment lactose → lactic acid → pH drops toward 4.6 → casein gels (why yogurt is thick and tangy)
- Kefir: bacteria + yeasts; cultured buttermilk/sour cream: Lactococcus species
- Fermented dairy: yogurt, kefir, cheese, cultured buttermilk, sour cream, cultured butter (diacetyl = buttery aroma)
- NOT fermented: ice cream, sweet-cream butter, milkshakes
- Probiotics = live beneficial microorganisms; prebiotics = fibers that feed them (e.g., inulin)
- Typical pH values: yogurt 4.0-4.6, buttermilk/sour cream ~4.4-4.8, cheddar ~5.0-5.5, fresh milk 6.6-6.7

MILK TYPES, INTOLERANCE, AND ALLERGIES:
- Fat levels: whole 3.25%, reduced-fat 2%, low-fat 1%, fat-free/skim ~0%
- Lactose-free milk: lactase enzyme added (hydrolyzes lactose into glucose + galactose; tastes sweeter)
- LACTOSE INTOLERANCE = enzyme deficiency (no/low lactase): gas, cramps; NOT an allergy; most adults worldwide have some degree
- MILK ALLERGY = immune (IgE) reaction to milk proteins (casein); goat milk still has lactose and casein → not safe
- Non-dairy milks (soy, almond, oat): fortified but not nutritionally equivalent to cow's milk
- Milk is a major allergen (FDA requires declaration); lactose-free milk still contains milk protein

LABELS AND REGULATION:
- FDA regulates US food labels (Nutrition Facts panel, ingredient list, allergen declaration)
- Fortification = adding nutrients; enrichment = adding back nutrients lost in processing
- Daily Values (DV) based on a 2,000 kcal diet; milk's nutrients of concern: calcium, potassium, vitamin D, riboflavin (B2)

MILK QUALITY TESTS (COMMONLY ASKED):
- Babcock (1890) and Gerber tests: measure milk fat % (sulfuric acid + centrifuge)
- Lactometer: specific gravity (detects added water); cryoscope: freezing point (added water raises toward 0 °C)
- Somatic cell count: high = mastitis (udder infection); standard plate count: bacteria/sanitation
- Pearson square: standardize fat % by mixing two ingredients (parts = diagonal differences)

LAB TASK ESSENTIALS (2027):
- Ice cream: milk/cream + sugar in small bag, ice + salt in large bag; scored by height of self-standing scoop
- Curds: acid (vinegar/lemon juice) drops → stir → stand → drain 15 min through cheesecloth → weigh; % curd = m_curds/m_milk × 100
- Butter: shake ~150 mL cream at ~13 °C until grains separate, pour off buttermilk, weigh; score = (your mass ÷ supervisor's mass) × 10, capped at 10
- Each experiment in the notebook must change only ONE independent variable

COMMON MISTAKES:
- Confusing lactose intolerance (enzyme problem) with milk allergy (immune response)
- Mixing up butyric acid (characteristic of milk fat) vs palmitic acid (most abundant)
- Thinking whey proteins curdle at pH 4.6 (only casein does; whey denatures with heat)
- Forgetting freezing point depression depends on particle count, not salt type
- Getting cream fat percentages out of order (half-and-half < light cream < light whipping < heavy)
- Assuming goat milk is safe for milk allergy (it still contains casein and lactose)`,
  'Forensics': `evidence analysis, toxicology, DNA analysis, document examination, and crime scene procedures.

FINGERPRINTS:
- Patterns: Loop (60-65%, most common), Whorl (30-35%), Arch (5%, rarest)
- Loop types: Ulnar (opens toward pinky), Radial (opens toward thumb)
- Whorl types: Plain, Central pocket, Double loop, Accidental
- Arch types: Plain, Tented
- Minutiae: Ridge endings, bifurcations (splits), dots - used for matching
- Latent prints: Invisible, need powder/chemicals to develop
- Patent prints: Visible, made in blood/ink/paint
- Plastic prints: 3D impressions in soft material
- AFIS: Automated Fingerprint Identification System

BLOOD EVIDENCE:
- Blood types: A, B, AB (universal recipient), O (universal donor)
- Rh factor: + or - (Rh+ can receive Rh-, Rh- cannot receive Rh+)
- Antigens: A has A antigens, B has B antigens, AB has both, O has neither
- Antibodies: A has anti-B, B has anti-A, AB has neither, O has both
- Presumptive tests: Kastle-Meyer (pink), Luminol (glows), detect possible blood
- Confirmatory tests: Precipitin test confirms human blood
- Blood spatter:
  - High velocity (gunshot): Fine mist, <1mm droplets
  - Medium velocity (beating): 1-4mm droplets
  - Low velocity (dripping): >4mm droplets
  - Direction: Tail points in direction of travel
  - Angle of impact: Width/Length = sin(angle)
  - Point of origin: Trace trajectories back using strings

TIME OF DEATH:
- Algor mortis: Body cooling, ~1.5°F (0.8°C) per hour until ambient
  - Formula: Hours since death ≈ (98.6 - body temp) / 1.5
- Livor mortis (lividity): Blood pooling in lowest areas
  - Begins immediately, becomes fixed after 8-12 hours
  - If moved after fixation, shows two patterns
- Rigor mortis: Muscle stiffening from ATP depletion
  - Begins 2-4 hours, complete at 6-12 hours, peaks at 12 hours
  - Dissipates 24-48 hours (in same order: jaw, neck, arms, legs)
- Decomposition stages: Fresh → Bloat → Active decay → Advanced decay → Dry
- Entomology: Insect succession helps estimate time of death

DNA ANALYSIS:
- Nuclear DNA: Inherited from both parents, unique (except identical twins)
- Mitochondrial DNA (mtDNA): Inherited from mother only, useful for degraded/hair samples
- STR (Short Tandem Repeats): 13+ loci analyzed, basis of DNA fingerprinting
- PCR (Polymerase Chain Reaction): Amplifies small DNA samples
- CODIS: Combined DNA Index System (FBI database)
- Gel electrophoresis: Separates DNA fragments by size

HAIR AND FIBER:
- Hair structure: Cuticle (outer), Cortex (middle, pigment), Medulla (inner core)
- Medulla patterns: Absent, Fragmented, Continuous, Stacked
- Hair can show: Species, body location, race, treatments, drugs
- Natural fibers: Cotton, wool, silk (from plants/animals)
- Synthetic fibers: Polyester, nylon, rayon (manufactured)
- Cross-section, color, diameter used for comparison

TOXICOLOGY:
- LD50: Dose lethal to 50% of test population
- Drugs metabolized mainly by liver
- Detection: Blood (recent), Urine (days), Hair (months)
- Common poisons: Cyanide (bitter almonds), Arsenic (garlic), Carbon monoxide (cherry red)
- Blood alcohol: 0.08% legal limit, 0.30%+ potentially fatal

DOCUMENT EXAMINATION:
- Handwriting analysis: 12+ characteristics compared
- Ink analysis: Chromatography separates components
- Paper analysis: Watermarks, fiber content
- Indented writing: ESDA (electrostatic detection) reveals impressions

CRIME SCENE:
- First responder: Secure scene, render aid, call for backup
- Chain of custody: Document every person who handles evidence
- Evidence collection: Photograph, sketch, collect, package, label
- Locard's Exchange Principle: "Every contact leaves a trace"

COMMON MISTAKES:
- Confusing fingerprint pattern types
- Getting blood type compatibility wrong (who can receive from whom)
- Mixing up the three mortis types and their timing
- Forgetting that mtDNA is maternal only`,
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
  'Heredity': `classic and molecular genetics for the 2027 Division B season: inheritance patterns, Punnett squares, pedigrees, chromosomes, and the basics of DNA.

EVENT SCOPE 2027 (DIVISION B):
- Answer questions, solve problems, and analyze data on classic AND molecular genetics
- Division C counterpart is Designer Genes (adds evolutionary genetics and deeper biotech)

GENETICS VOCABULARY:
- Gene: DNA segment coding a trait; allele: version of a gene
- Genotype (alleles, e.g., Aa) vs. phenotype (expressed trait)
- Homozygous (AA/aa) vs. heterozygous (Aa); dominant vs. recessive alleles
- P (parental) → F₁ (first filial) → F₂ generations; true-breeding = homozygous

MENDELIAN INHERITANCE:
- Law of segregation: two alleles separate into different gametes during meiosis
- Law of dominance: one allele can mask another in heterozygotes
- Law of independent assortment: genes on different chromosomes sort into gametes independently
- Punnett squares: monohybrid Aa × Aa → 3:1 phenotype, 1:2:1 genotype
- Dihybrid AaBb × AaBb → 9:3:3:1 phenotypic ratio
- Probability: product rule for AND, sum rule for OR; coin-flip logic applies to alleles
- Testcross with homozygous recessive reveals unknown genotype

BEYOND SIMPLE MENDELIAN:
- Incomplete dominance: red × white snapdragon → pink (blend)
- Codominance: both alleles show (roan cattle, AB blood type)
- Multiple alleles: ABO blood groups (I^A, I^B dominant, i recessive; A and B codominant)
- Sex-linked traits: on X chromosome; males (XY) express recessive X alleles with no second copy
- X-linked recessive examples: red-green colorblindness, hemophilia, Duchenne muscular dystrophy
- Carrier: heterozygous individual who shows no symptoms but can pass recessive allele

PEDIGREE ANALYSIS:
- Squares = male, circles = female; shaded = affected; half-shaded = carrier
- Autosomal recessive clues: skips generations, affected kids from unaffected (carrier) parents
- Autosomal dominant clues: every affected person has an affected parent; no carriers
- X-linked recessive clues: more males affected; affected fathers DO NOT pass to sons (get Y instead)

CHROMOSOMES AND KARYOTYPES:
- Humans: 46 chromosomes, 23 pairs (22 autosomes + 1 sex pair); XX female, XY male
- Nondisjunction (failure of chromosomes to separate in meiosis): trisomy or monosomy
- Down syndrome: trisomy 21; Turner syndrome: XO (female); Klinefelter: XXY (male)
- Mutations can be chromosomal (deletion, duplication, inversion, translocation) or gene-level

MOLECULAR GENETICS BASICS:
- DNA double helix: A pairs with T (2 H-bonds), G pairs with C (3 H-bonds); sugar-phosphate backbone
- DNA → mRNA (transcription) → protein (translation at ribosome); codons of 3 bases
- Mutations: substitution (point), insertion/deletion (frameshift); effects range from silent to severe
- Meiosis makes gametes (haploid n); fertilization restores diploid 2n

COMMON GENETIC DISORDERS TO KNOW:
- Autosomal recessive: cystic fibrosis, sickle cell disease, PKU, Tay-Sachs
- Autosomal dominant: Huntington's disease, achondroplasia
- X-linked recessive: hemophilia, colorblindness, Duchenne muscular dystrophy
- Chromosomal: Down (21), Turner (XO), Klinefelter (XXY)

COMMON MISTAKES:
- Assigning X-linked alleles to Y (Y carries almost no X-linked alleles; fathers pass X to daughters only)
- Treating carriers as affected for recessive disorders
- Mixing up genotype ratio (1:2:1) with phenotype ratio (3:1) in monohybrid crosses
- Confusing incomplete dominance (blend) with codominance (both show)
- Forgetting meiosis (not mitosis) produces gametes`,
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
  'Meteorology': `Earth's atmosphere and weather for the 2027 Division B season, with a focus on Severe Weather and Storms and interpreting meteorological data.

EVENT FOCUS 2027 (SEVERE WEATHER AND STORMS):
- Division B event; 2027 topic = severe weather: factors that contribute to, cause, and influence severe weather and storms
- Interpretation of meteorological data, graphs, maps, charts, tables, and images is emphasized

ATMOSPHERE BASICS:
- Composition: ~78% N₂, ~21% O₂, ~1% argon + trace gases (CO₂, water vapor variable)
- Layers from ground up: troposphere (weather happens here, temperature decreases with height), stratosphere (ozone layer, temp increases), mesosphere, thermosphere
- Pressure and density decrease exponentially with altitude; standard sea level pressure = 1013.25 mb / 29.92 inHg
- Lapse rate ~6.5 °C per km in the troposphere

THUNDERSTORMS:
- Need: moisture, instability (warm air rises), lifting mechanism (front, convection, orographic)
- Stages: cumulus (updrafts build) → mature (updrafts + downdrafts, heaviest rain/hail, lightning) → dissipating (downdraft dominates)
- Lightning: charge separation from ice colliding in updrafts (graupel vs. ice crystals); negative cloud base induces positive charge at ground; return stroke = bright flash
- Thunder: rapid heating/expansion of air; ~3 seconds per kilometer (5 s per mile) from flash to bang
- Derecho: widespread, long-lived straight-line windstorm from a bow echo

TORNADOES:
- Form mainly from supercell thunderstorms with a rotating updraft (mesocyclone)
- Wall cloud lowers; tornado descends; wind speeds up to >300 mph in strongest
- Enhanced Fujita (EF) scale rates damage EF0 (weak) to EF5 (incredible); rated by DAMAGE, not measured wind
- Tornado Alley: central US (warm moist Gulf air meets dry air from Rockies + wind shear)
- US averages ~1,200 tornadoes/year; peak season spring in the South, late spring/summer on Plains

HURRICANES (TROPICAL CYCLONES):
- Need: ocean ≥ ~26.5 °C, low vertical wind shear, Coriolis effect (none within ~5° of equator), pre-existing disturbance, high humidity through depth
- Structure: eye (calm, clear, sinking air), eyewall (strongest winds), spiral rain bands
- Saffir-Simpson categories 1-5 by sustained WIND speed (74-95, 96-110, 111-129, 130-156, 157+ mph); category 3+ = major
- Biggest killer usually storm surge + freshwater flooding, not wind
- Northern hemisphere: counterclockwise rotation; rotate clockwise south of the equator; move westward with trade winds then recurve poleward
- Names: alternating male/female lists, retired for deadly storms

WINTER STORMS AND OTHER SEVERE WEATHER:
- Blizzards: snow + sustained winds ≥ 35 mph + visibility ≤ ¼ mile ≥ 3 hours (falling OR blowing snow)
- Lake-effect snow: cold air over warm unfrozen lakes picks up moisture, dumps downwind
- Ice storms: freezing rain (rain freezing on contact at/below freezing surface)
- Hail: ice pellets cycled by thunderstorm updrafts (more cycles = larger); largest hail with strongest updrafts
- Flash floods: #2 weather killer; 6 inches of moving water can knock you down, 12 inches can float a car

DATA INTERPRETATION (EMPHASIZED 2027):
- Weather maps: isobars (close together = strong pressure gradient = high winds); Highs = clockwise/ sinking/ fair; Lows = counterclockwise/ rising/ stormy
- Fronts: cold (blue triangles, steep, fast, thunderstorms), warm (red semicircles, gentle, steady rain), occluded (purple, cold catches warm), stationary (alternating symbols, stalled)
- Station models: temperature, dew point, wind barbs (barb = 10 knots), pressure, cloud cover, current weather symbols
- Radar: reflectivity (dBZ) for precipitation intensity; hook echo = possible tornado; satellite IR shows cloud-top temperature
- Instruments: barometer (pressure), anemometer (wind speed), wind vane (direction), hygrometer/psychrometer (humidity), rain/snow gauge, thermometer, radiosonde (weather balloon)

WATCH VS WARNING (CLASSIC TEST ITEM):
- Watch = conditions are favorable, be prepared (issued for broad area, longer window)
- Warning = event occurring or imminent, take action NOW (smaller area, short window)
- Safety: lowest floor, interior room away from windows for tornado; evacuate storm surge zones for hurricane

COMMON MISTAKES:
- Mixing up watch vs. warning
- Rating hurricanes by pressure or surge instead of wind speed
- Pointing cold front triangles opposite the direction of travel (they point the way the front moves)
- Assuming the eye is the most dangerous part of a hurricane (eyewall is)
- Measuring lightning distance with the wrong seconds-to-distance conversion`,
  'Microbe Mission': `bacterial structure, viral replication, fungal characteristics, microbial ecology, and lab techniques.

BACTERIA (Prokaryotes):
- No nucleus (DNA in nucleoid region), no membrane-bound organelles
- Cell wall: Peptidoglycan (unique to bacteria)
- Shapes: Cocci (spheres), Bacilli (rods), Spirilla (spirals), Vibrio (comma)
- Arrangements: Diplo- (pairs), Strepto- (chains), Staphylo- (clusters)
- Reproduction: Binary fission (asexual), ~20 min doubling time
- Genetic exchange: Conjugation (plasmid transfer), Transformation (DNA uptake), Transduction (via phage)
- Structures: Flagella (movement), Pili (attachment), Capsule (protection), Endospores (survival)

GRAM STAINING:
1. Crystal violet (purple) - all bacteria stain purple
2. Iodine (mordant) - fixes crystal violet
3. Alcohol/acetone (decolorizer) - removes from thin cell walls
4. Safranin (counterstain) - stains decolorized cells pink
- Gram+ (purple): Thick peptidoglycan, no outer membrane (Staphylococcus, Streptococcus)
- Gram- (pink/red): Thin peptidoglycan, outer membrane with LPS (E. coli, Salmonella)

VIRUSES:
- NOT cells, NOT alive by most definitions
- Structure: Genetic material (DNA OR RNA, never both) + Protein coat (capsid) ± Envelope
- Shapes: Helical, Icosahedral (20 faces), Complex (bacteriophages)
- Size: 20-300 nm (much smaller than bacteria)
- Must use host cell machinery to replicate
- Lytic cycle: Attachment → Entry → Replication → Assembly → Lysis (kills cell)
- Lysogenic cycle: DNA integrates into host genome (prophage), replicates with host
- Retroviruses (HIV): RNA → DNA (reverse transcriptase) → integrates into host

FUNGI:
- Eukaryotic (membrane-bound nucleus and organelles)
- Cell walls of CHITIN (not peptidoglycan)
- Heterotrophs (absorb nutrients externally)
- Body forms: Unicellular (yeasts) or Multicellular (molds, mushrooms)
- Multicellular structure: Hyphae (threads) → Mycelium (network)
- Reproduction: Spores (sexual and asexual)
- Examples: Yeast (Saccharomyces), Bread mold (Rhizopus), Mushrooms, Penicillium
- Symbioses: Mycorrhizae (with plants), Lichens (with algae/cyanobacteria)

PROTISTS:
- Eukaryotic, mostly unicellular, very diverse group
- Animal-like (protozoa): Heterotrophs, motile
  - Amoeba (pseudopods), Paramecium (cilia), Euglena (flagella), Plasmodium (malaria)
- Plant-like (algae): Photosynthetic
  - Diatoms, Dinoflagellates (red tide), Kelp, Chlamydomonas
- Fungus-like: Slime molds, Water molds

MICROBIAL ECOLOGY:
- Decomposers: Break down dead organic matter, recycle nutrients
- Nitrogen fixation: N₂ → NH₃ (Rhizobium in legume root nodules)
- Normal flora: Beneficial microbes on/in body (gut bacteria aid digestion)
- Pathogens: Disease-causing microbes
- Extremophiles: Thrive in extreme conditions (thermophiles, halophiles, acidophiles)

LAB TECHNIQUES:
- Aseptic technique: Prevent contamination
- Streaking for isolation: Get individual colonies
- Serial dilution: Reduce concentration for counting
- Pour plate / Spread plate: Grow colonies for counting
- Colony characteristics: Shape, color, margin, elevation
- Selective media: Favors certain organisms (MacConkey for Gram-)
- Differential media: Distinguishes organisms (Blood agar for hemolysis)

DISEASE & IMMUNITY:
- Koch's postulates: Criteria to prove microbe causes disease
- Transmission: Direct contact, Droplet, Airborne, Fecal-oral, Vector-borne
- Antibiotics: Target bacteria (not viruses!) - cell wall, protein synthesis, DNA replication
- Antibiotic resistance: Overuse → selection for resistant strains
- Vaccines: Stimulate immune response without causing disease

IMPORTANT DISEASES:
- Bacterial: Tuberculosis (Mycobacterium), Strep throat, Food poisoning (E. coli, Salmonella), Lyme disease (Borrelia)
- Viral: Influenza, HIV/AIDS, COVID-19, Rabies, Measles, Chickenpox
- Fungal: Athlete's foot, Ringworm (not a worm!), Candidiasis, Histoplasmosis
- Protist: Malaria (Plasmodium), Amoebic dysentery, Sleeping sickness

COMMON MISTAKES:
- Calling viruses "alive" or "cells"
- Confusing Gram+ (purple) vs Gram- (pink)
- Saying bacteria have a nucleus
- Confusing chitin (fungi) with peptidoglycan (bacteria)
- Thinking antibiotics work on viruses`,
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
  'Protein Modeling': `protein structure and folding for the 2027 Division C season, with the event focus on the sialic acid binding site of the 2009 H1N1 influenza hemagglutinin protein.

EVENT FOCUS 2027 (INFLUENZA HEMAGGLUTININ):
- Division C event with THREE parts: written exam, pre-build model, and on-site build
- 2027 pre-build: a physical model of the SIALIC ACID BINDING SITE of the 2009 H1N1 influenza hemagglutinin (HA), built from computer visualization and online resources
- Written exam covers protein structure, function, folding, and the focus protein's biology
- On-site build uses provided materials (e.g., Mini-Toober) with the guide posted during competition

LEVELS OF PROTEIN STRUCTURE:
- Primary: amino acid sequence (peptide bonds); residue side chains determine folding
- Secondary: α-helix and β-sheet, held by backbone hydrogen bonds (C=O accepts, N-H donates)
- Tertiary: overall 3D fold of one chain, driven by R-group interactions: hydrophobic effect (burial in core), hydrogen bonds, ionic (salt bridges), van der Waals, disulfide bridges (cysteine-cysteine covalent)
- Quaternary: assembly of multiple subunits (e.g., hemoglobin = 4 subunits; hemagglutinin = trimer)
- Folding is driven mainly by the hydrophobic effect; chaperones assist in cells; misfolding → aggregates (prions, amyloid)

AMINO ACIDS AND CHEMISTRY:
- 20 standard amino acids; structure: central α-carbon + amino group + carboxyl group + R group
- Categories: nonpolar (glycine, alanine, valine, leucine, isoleucine, methionine, proline, phenylalanine), polar uncharged (serine, threonine, cysteine, tyrosine, asparagine, glutamine), acidic/negative (aspartate, glutamate), basic/positive (lysine, arginine, histidine)
- Proline kinks chains (rigid ring); glycine is most flexible (tiny side chain)
- pI = pH at which net charge is zero; acidic proteins have pI below 7

VISUALIZATION AND MODELING TOOLS:
- Molecular visualization: Jmol/JSmol, PyMOL, UCSF Chimera; view PDB files from RCSB Protein Data Bank (rcsb.org)
- Renderings: backbone (α-carbon trace), cartoon/ribbon, spacefill, wireframe, dots
- Ramachandran plot: φ (phi) vs. ψ (psi) backbone angles; favored regions define allowed secondary structures
- 3D Molecular Designs / MSOE Center for BioMolecular Modeling materials guide many builds

FOCUS PROTEIN 2027 - HEMAGGLUTININ:
- HA is a flu virus surface glycoprotein: a homotrimer; each monomer cleaved into HA1 (head) and HA2 (stem)
- Function: HA1 binds SIALIC ACID receptors on host airway cells; HA2 drives membrane fusion after endocytosis (low pH triggers a dramatic conformational change exposing the fusion peptide)
- Antibodies against the HA head block receptor binding = neutralizing antibodies; the head mutates fast (antigenic drift), the stem is more conserved (target of universal vaccine research)
- 2009 H1N1 ("swine flu") pandemic: reassortment produced a new HA to which young people had little immunity
- Drugs: oseltamivir (Tamiflu) targets neuraminidase (the other surface protein), not HA

MODELING JUDGING ESSENTIALS:
- Pre-builds scored on accuracy to the target structure: placement of specified residues, secondary structure, overall fold, added creative additions per rules
- On-site builds scored on folding accuracy and prescribed additions within time limit
- Bring and use the rules' allowed references; check the event page for the exact residue list

COMMON MISTAKES:
- Confusing secondary-structure H-bond direction (backbone C=O···H-N, NOT side chains)
- Calling any R-group interaction a disulfide bridge (only cysteine pairs qualify)
- Mixing up HA (binding/fusion) with NA (release of new virions, drug target)
- Forgetting HA is a trimer (quaternary structure) when modeling the binding site
- Ignoring orientation/depth of the binding pocket when adding side chains to a model`,
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
  'Remote Sensing': `satellite imagery and Earth-observation data for the 2027 season; Division C tasks center on climate change processes in the Earth system.

EVENT FOCUS 2027:
- Division B: basic principles of remote sensing + interpreting Earth observation imagery, data, and maps
- Division C: remote sensing imagery, data, and computational process skills applied to CLIMATE CHANGE PROCESSES in the Earth system
- Expect image interpretation, map/GIS tasks, data plots, and mission knowledge

ELECTROMAGNETIC SPECTRUM AND BANDS:
- Remote sensing uses visible, infrared, microwave, and radar wavelengths
- Vegetation: strong reflectance in near-infrared (NIR), absorption of red by chlorophyll
- NDVI = (NIR - red) / (NIR + red): healthy vegetation → values near +1; bare soil/water lower
- Thermal IR measures surface temperature; passive microwave senses atmospheric water/vapor; radar penetrates clouds and night
- False-color composites: vegetation typically appears RED in standard NIR-R-G composites (not green)

FOUR RESOLUTION TYPES (CLASSIC TEST ITEM):
- Spatial: smallest feature distinguishable (e.g., 30 m for Landsat MSS/TM-class)
- Temporal: revisit time (geostationary = minutes; Landsat = ~16 days per satellite)
- Spectral: number and width of bands (hyperspectral = many narrow bands)
- Radiometric: sensitivity to brightness differences (bit depth, e.g., 8-bit = 256 levels)

SENSORS AND PLATFORMS:
- Passive sensors measure reflected sunlight or emitted radiation (optical, thermal IR)
- Active sensors emit their own signal: radar (cloud-penetrating, measures surface roughness/height) and lidar (laser, forest canopy structure)
- Orbits: geostationary (~35,786 km, hovers over one spot - weather: GOES) vs. polar/sun-synchronous (low Earth orbit, imaging: Landsat, Sentinel, MODIS)
- SWOT measures surface water; GRACE tracks groundwater by gravity change; SMAP measures soil moisture; GPM precipitation

KEY MISSIONS AND DATA:
- Landsat: longest continuous record (since 1972), free data, land cover change
- Sentinel (Copernicus/EU): Sentinel-1 radar, Sentinel-2 optical, Sentinel-3/5p climate and atmosphere
- MODIS/Terra+Aqua: global daily vegetation, fire, SST; GOES-R: US weather
- Sea level: satellite altimetry (TOPEX/Poseidon, Jason series); ice: ICESat laser, GRACE gravity, CryoSat

CLIMATE CHANGE PROCESSES (DIVISION C 2027 EMPHASIS):
- Greenhouse effect: CO₂, CH₄, H₂O vapor absorb and re-emit outgoing IR; Keeling curve = rising CO₂ (Mauna Loa)
- Evidence tracked from orbit: global temperature anomalies, sea level rise (~3-4 mm/yr), shrinking ice sheets/sea ice, glacier retreat, snowpack decline
- Biosphere: shifting growing seasons, drought indices, wildfire frequency/extent, deforestation, desertification
- Ocean: warming SSTs, acidification proxies, coral bleaching events, circulation changes
- Interpreting anomaly maps, time-series graphs, and difference images is heavily tested

IMAGE INTERPRETATION SKILLS:
- Identify land forms/land use in false color; read scale bars, legends, north arrows
- GIS concepts: layers (raster vs. vector), overlay analysis, change detection between dates
- Shadows and sun angle for relief; texture for vegetation/urban; pattern/tone/shape cues

COMMON MISTAKES:
- Reading false-color images as true color (healthy vegetation = red in NIR composites)
- Swapping numerator terms in NDVI
- Confusing active (radar/lidar) with passive (optical) sensors
- Mixing up geostationary vs. polar orbit altitudes and uses
- Treating correlation images as single-date truth without checking the time period`,
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
- Igneous: From magma/lava. Intrusive (slow cooling, large crystals - granite) vs Extrusive (fast cooling, small/no crystals - basalt)
- Sedimentary: From weathering/deposition. Clastic (sandstone), Chemical (limestone from precipitation), Organic (coal)
- Metamorphic: Changed by heat/pressure. Foliated (slate, schist, gneiss) vs Non-foliated (marble, quartzite)

COMMON MISTAKES: Confusing cleavage vs fracture. Mixing up intrusive vs extrusive igneous rocks.`,
  'Solar System': `solar system science for the 2027 Division B season, with the event focus on habitability within and beyond the Solar System.

EVENT FOCUS 2027 (HABITABILITY):
- Division B event; 2027 topic = habitability within and beyond the Solar System
- Know what makes worlds habitable, where livable environments exist in our solar system, and how we find and evaluate exoplanets

FORMATION AND STRUCTURE:
- Nebular hypothesis: solar system formed ~4.6 billion years ago from a collapsing molecular cloud; sun ignited via fusion; planets accreted from the disk
- Frost line: boundary beyond which ices could condense; inside = rocky terrestrial planets; outside = gas/ice giants
- Order: Mercury, Venus, Earth, Mars (terrestrial) | Jupiter, Saturn (gas giants), Uranus, Neptune (ice giants)
- Asteroid belt between Mars and Jupiter; Kuiper Belt beyond Neptune (Pluto, other dwarf planets); Oort Cloud = distant comet reservoir
- Age dating: crater counts (more craters = older surface), radiometric dating of meteorites

KEY PLANET FACTS:
- Mercury: smallest, no atmosphere, extreme temperature swings, fastest orbit
- Venus: runaway greenhouse, hottest surface (~465 °C), sulfuric acid clouds, rotates backward slowly
- Earth: liquid surface water, plate tectonics, strong magnetic field, life
- Mars: evidence of ancient water (valleys, minerals), thin CO₂ atmosphere, Olympus Mons (largest volcano), Valles Marineris
- Jupiter: largest; Great Red Spot; Galilean moons; strong radiation
- Saturn: ring system; density less than water (would float)
- Uranus: rotates on its side (98° axial tilt); Neptune: fastest winds

MOONS AND OCEAN WORLDS (HABITABILITY FOCUS):
- Io: most volcanically active body (tidal heating)
- Europa: subsurface saltwater ocean under ice = prime habitability candidate
- Ganymede: largest moon in the solar system, own magnetic field
- Callisto: heavily cratered, possible subsurface ocean
- Titan (Saturn): thick N₂ atmosphere, methane/ethane lakes and rain (cryovolcanism)
- Enceladus (Saturn): south-polar geysers vent ocean material into space (Cassini flew through them)
- Triton (Neptune): retrograde orbit (captured Kuiper Belt object), nitrogen geysers
- Our Moon: formed by giant impact; phases, tides, libration

HABITABILITY CRITERIA:
- Habitable zone (Goldilocks zone): range of distances where liquid water is stable on the surface; depends on star luminosity
- Requirements for life as we know it: liquid water, energy source, CHNOPS elements, stable environment
- Life can exist WITHOUT sunlight (chemosynthesis at hydrothermal vents) - widens habitability beyond the zone
- Extremophiles on Earth (acid, radiation, heat, salt) set the bounds for what counts as extreme
- Planetary protections: magnetic field deflects solar wind (Mars lost its atmosphere), atmosphere regulates temperature, large moon stabilizes axial tilt
- Greenhouse effect: keeps Earth ~33 °C warmer than it would otherwise be; too much = Venus

EXOPLANETS (BEYOND THE SOLAR SYSTEM):
- Detection methods: transit (dip in starlight - Kepler/TESS), radial velocity (Doppler wobble), direct imaging, microlensing
- Over 5,000 confirmed; small rocky worlds in habitable zones are known (e.g., TRAPPIST-1 system, Proxima b)
- Biosignatures being sought: oxygen + methane together, water vapor, seasonal changes
- SETI: radio/optical searches; Drake Equation organizes factors estimating communicating civilizations

MISSIONS TO KNOW:
- Cassini-Huygens (Saturn/Titan), Galileo and Europa Clipper (Jupiter system), Juno (Jupiter), Voyager 1/2 (interstellar space), Perseverance + Ingenuity (Mars sample caching), New Horizons (Pluto/Kuiper Belt), OSIRIS-REx (asteroid sample return), DART (asteroid deflection test), JWST (atmospheres of exoplanets)

SMALL BODIES:
- Asteroids: rocky/metallic; types (C, S, M); belt + near-Earth objects
- Comets: dirty snowballs (ice + dust); coma and tails form near the sun; ion tail points AWAY from the sun (solar wind) regardless of direction of motion; dust tail curves along orbit
- Meteoroid (in space) → meteor (streak in atmosphere) → meteorite (lands)
- Meteor showers: Earth crossing comet debris trails (Perseids, Geminids)

COMMON MISTAKES:
- Pointing comet tails toward (or trailing behind) the comet - ion tails point away from the SUN
- Calling Venus habitable because it is "Earth's twin" (greenhouse makes it lethal)
- Forgetting moons count as habitability candidates (Europa, Enceladus, Titan) even outside the habitable zone
- Mixing up meteor/meteorite/meteoroid terminology
- Assuming the habitable zone guarantees life (Mars is in ours; Venus was too)`,
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
  'Water Quality': `aquatic science for the 2027 season, with the event focus on understanding and evaluating marine and estuary aquatic environments.

EVENT FOCUS 2027 (MARINE AND ESTUARY ENVIRONMENTS):
- Both Division B and Division C; 2027 topic = marine and estuary aquatic environments
- Combines water quality testing, bioindicators (macroinvertebrates), aquatic ecology, and human impacts
- Division C adds more salinity/chemistry math and species ID depth

WATER QUALITY PARAMETERS (CORE OF THE EVENT):
- Dissolved oxygen (DO): colder water holds MORE oxygen; altitude lowers saturation; aquatic life needs ≥ 5-6 mg/L; below ~2 mg/L = hypoxia
- Biochemical oxygen demand (BOD): oxygen consumed by decomposers; HIGH BOD = organic pollution
- Temperature: affects DO and metabolism; thermal pollution lowers DO
- pH: most aquatic life tolerates ~6.5-8.5; acid deposition and mining lower pH
- Turbidity: cloudiness (Secchi disk); high turbidity blocks light, smothers eggs, carries pathogens
- Salinity: fresh <0.5 ppt; brackish 0.5-30 ppt; ocean ~35 ppt; measured by hydrometer/refractometer/conductivity
- Nitrates and phosphates: below 1 mg/L nitrate-nitrogen expected in healthy systems; elevated = fertilizer runoff, sewage → eutrophication
- Conductivity/TDS: tracks dissolved ions; sudden change signals discharge

MACROINVERTEBRATE BIOINDICATORS:
- Pollution-INTOLERANT (good water): stonefly, caddisfly, mayfly, dobsonfly/hellgrammite, water penny, gilled snails, riffle beetle
- Somewhat tolerant: dragonfly, damselfly, crayfish, scuds, sowbug, clams/mussels
- Pollution-TOLERANT (poor water): blood midge (red), tubifex worms, leeches, aquatic worms, lunged/pouch snails
- Biotic Index: weight taxa by tolerance, average the scores; higher diversity usually = cleaner water
- EPT index: count of Ephemeroptera + Plecoptera + Trichoptera (mayfly, stonefly, caddisfly) - high EPT = healthy stream

MARINE AND ESTUARY ENVIRONMENTS (2027 EMPHASIS):
- Estuary: partially enclosed body where river meets sea; brackish water; salinity gradients by depth and season
- Estuaries are nurseries: sheltered, nutrient-rich; salt marshes, mangroves, and seagrass beds stabilize shorelines and filter runoff
- Estuary types: drowned river valleys (Chesapeake), fjords, bar-built, tectonic
- Tides: caused by moon's gravity (and sun); spring (aligned, largest range) vs. neap (quarter moons, smallest range)
- Vertical zonation: intertidal (exposed at low tide), subtidal; physical stresses select tough species (barnacles, mussels, sea stars)
- Marine zones: photic (light, photosynthesis) vs. aphotic; pelagic (open water) vs. benthic (bottom); neritic (over shelf) vs. oceanic; abyssal plains, hydrothermal vents (chemosynthesis)
- Coral reefs: warm, shallow, clear, symbiotic zooxanthellae; bleaching = expelling symbionts under heat stress
- Key species: keystone (sea otter controls urchins), invasive (lionfish; green crab), filter feeders (oysters clean water)

HUMAN IMPACTS AND PROCESSES:
- Eutrophication: nutrient overload → algal bloom → decay consumes oxygen → hypoxic dead zone (Gulf of Mexico)
- Harmful algal blooms (red tide): toxins, fish kills; caused by dinoflagellates (Karenia brevis)
- Ocean acidification: excess CO₂ + H₂O → carbonic acid; lower pH hampers shell/skeleton building (oysters, corals, pteropods)
- Dead zones, oil spills, plastic pollution, overfishing (trophic cascades), wetland loss
- Watershed: all land draining to a waterbody; everything upstream affects downstream estuaries

MONITORING AND STEWARDSHIP:
- Sampling: test sites upstream/downstream of suspected sources; replicate measurements
- WQI (Water Quality Index): weighted combination of parameter scores into one number
- Best management practices: riparian buffers, restored wetlands, stormwater control, wastewater treatment (primary/secondary/tertiary)

COMMON MISTAKES:
- Thinking warm water holds more oxygen (colder water holds more)
- Reading BOD backward (HIGH BOD = polluted, not clean)
- Classifying blood midges/tubifex worms as good indicators (they tolerate pollution)
- Forgetting estuaries are BRACKISH (mixing fresh and salt), not fully marine
- Calling spring tides seasonal (they align with new/full moons, not the season)`,
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
  'Thermodynamics': `heat transfer, the laws of thermodynamics, calorimetry, thermal properties of matter, gas laws, and heat engine cycles.

LAWS OF THERMODYNAMICS:
- Zeroth Law: If A and B are each in thermal equilibrium with C, then A and B are in thermal equilibrium with each other (basis of temperature measurement)
- First Law: Energy conservation - ΔU = Q - W (heat added minus work done BY the gas)
- Second Law: Entropy of an isolated system never decreases; heat flows spontaneously from hot to cold
- Third Law: As T approaches absolute zero (0 K), entropy of a perfect crystal approaches zero

HEAT TRANSFER:
- Conduction: Direct molecular collision (solids best); rate Q/t = kAΔT/L (k = thermal conductivity; metals high, styrofoam/aerogel low)
- Convection: Bulk fluid movement (natural = density-driven, forced = fans/pumps)
- Radiation: Electromagnetic waves, no medium needed; Stefan-Boltzmann law Q/t = σeAT⁴ (σ = 5.67×10⁻⁸ W/m²·K⁴)
- Vacuum flask/thermos defeats all three: vacuum (no conduction/convection), reflective walls (radiation), tight stopper (convection)

CALORIMETRY:
- q = mcΔT (specific heat); water c = 4.184 J/g·°C = 1 cal/g·°C (very high - moderates climate)
- Phase changes: q = mL, no temperature change (latent heat); water fusion L = 334 J/g, vaporization L = 2260 J/g
- Calorimetry: Q_lost = Q_gained; mixtures reach equilibrium temperature
- Internal energy of ideal gas depends only on temperature

THERMAL EXPANSION:
- Linear: ΔL = αL₀ΔT; Volume: ΔV = βV₀ΔT where β ≈ 3α
- Water anomaly: maximum density at 4°C; ice floats (expands ~9% on freezing)
- Applications: bimetallic strips (thermostats), expansion joints, liquid-in-glass thermometers

KINETIC THEORY & GAS LAWS:
- Ideal gas: PV = nRT; R = 8.314 J/mol·K; 1 mol at STP = 22.4 L
- Average KE = (3/2)kT; speed ∝ √(T/m)
- Boyle: P₁V₁ = P₂V₂ (T fixed); Charles: V/T constant (P fixed); Gay-Lussac: P/T constant (V fixed)
- Processes: isothermal (ΔT=0), isobaric (ΔP=0), isochoric (ΔV=0), adiabatic (Q=0)

PV DIAGRAMS & WORK:
- W = PΔV for constant pressure; general W = area under PV curve
- Cycle: net work = enclosed area (clockwise = engine, counterclockwise = refrigerator)
- Isotherm curves (hyperbolas); adiabats steeper than isotherms

HEAT ENGINES & EFFICIENCY:
- e = W/Q_h = 1 - Q_c/Q_h; can never be 100% (Second Law)
- Carnot efficiency (theoretical max): e_max = 1 - T_c/T_h (temperatures in KELVIN)
- Refrigerators/heat pumps run cycles in reverse; COP = Q_c/W (fridge) or Q_h/W (heat pump)
- Entropy: ΔS = Q_rev/T; Gibbs free energy ΔG = ΔH - TΔS (spontaneous if negative)

DEVICE BUILD (INSULATION):
- Goal: construct a device to retain heat; score based on temperature retention over time
- Minimize conduction (low-k materials: styrofoam, fiberglass, aerogel), convection (eliminate air gaps/circulation), radiation (reflective barriers like foil)
- R-value = thickness/k (higher = better insulator); phase-change materials absorb heat at constant temperature
- Common designs: nested containers with insulating layers, sealed lids, small volume-to-surface ratio

COMMON MISTAKES:
- Using °C instead of K in gas-law ratios and Carnot efficiency
- Forgetting that temperature stays constant during phase changes
- Sign errors on W: work done BY gas vs work done ON gas
- Confusing heat (energy transfer, q) with temperature (average KE)`,

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

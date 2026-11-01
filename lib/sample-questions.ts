/** Short, original examples for visitors to try without signing in. */
export const SAMPLE_QUESTIONS: Record<string, { question: string; options: string[]; answer: string; explanation: string }> = {
  Astronomy: {
    question: 'Two stars have the same luminosity. If Star B is twice as far away as Star A, how does its apparent brightness compare?',
    options: ['Half as bright', 'One-quarter as bright', 'Twice as bright', 'Four times as bright'],
    answer: 'One-quarter as bright',
    explanation: 'Apparent brightness follows the inverse-square law. Doubling the distance reduces the received flux to 1/2², or one-quarter.',
  },
  'Anatomy and Physiology': {
    question: 'Which chamber of the heart pumps oxygenated blood into the aorta?',
    options: ['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'],
    answer: 'Left ventricle',
    explanation: 'The left ventricle pumps oxygenated blood through the aortic valve into the aorta, which distributes it to the body.',
  },
  'Disease Detectives': {
    question: 'At a picnic, 30 of 60 people who ate potato salad became ill. What was the attack rate among those who ate it?',
    options: ['30%', '50%', '60%', '90%'],
    answer: '50%',
    explanation: 'The attack rate in the exposed group is the number who became ill divided by the total who ate the salad: 30 ÷ 60 = 50%.',
  },
};

// Deeper question sets for the highest-traffic-potential event pages, per the
// SEO review: one sample question wasn't enough content depth to outrank
// scioly.org wiki pages. Each set leads with the featured question above
// (when one exists) so the two exports never drift apart. Questions are
// fact-checked against the same sources as the topic guides; 2027-theme
// events (A&P, Dynamic Planet, Water Quality, Meteorology) emphasize this
// season's rules topics.
export interface SampleQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const SAMPLE_QUESTION_SETS: Record<string, SampleQuestion[]> = {
  'Anatomy and Physiology': [
    SAMPLE_QUESTIONS['Anatomy and Physiology'],
    {
      question: 'Most chemical digestion and nutrient absorption occur in which organ?',
      options: ['Stomach', 'Small intestine', 'Large intestine', 'Esophagus'],
      answer: 'Small intestine',
      explanation:
        'The small intestine completes chemical digestion with bile and pancreatic enzymes and absorbs most nutrients across its villi and microvilli. The large intestine mainly reabsorbs water.',
    },
    {
      question: 'Which enzyme begins protein digestion in the stomach?',
      options: ['Amylase', 'Pepsin', 'Lipase', 'Trypsin'],
      answer: 'Pepsin',
      explanation:
        'Chief cells secrete inactive pepsinogen, which stomach acid (HCl) converts to active pepsin - the enzyme that starts breaking proteins into smaller peptides.',
    },
    {
      question: 'Which cells directly produce and secrete antibodies?',
      options: ['Helper T cells', 'Plasma cells', 'Cytotoxic T cells', 'Macrophages'],
      answer: 'Plasma cells',
      explanation:
        'Plasma cells are activated B lymphocytes adapted to mass-produce and secrete antibodies. Helper T cells coordinate the response; cytotoxic T cells kill infected cells directly.',
    },
    {
      question: 'Which immunoglobulin class mediates allergic responses and parasitic defense?',
      options: ['IgG', 'IgA', 'IgM', 'IgE'],
      answer: 'IgE',
      explanation:
        'IgE binds to mast cells and basophils; cross-linking by an allergen triggers histamine release - the basis of allergies. IgG is most abundant, IgA guards mucosa, IgM is the first responder.',
    },
  ],
  Astronomy: [
    SAMPLE_QUESTIONS.Astronomy,
    {
      question: 'What is the spectral type and luminosity class of the Sun?',
      options: ['O5V', 'G2V', 'M0III', 'B8V'],
      answer: 'G2V',
      explanation:
        'The Sun is a G2 (yellow, ~5,800 K surface) main-sequence dwarf - "V" is the luminosity class for main-sequence stars.',
    },
    {
      question: 'A star has a parallax of 0.05 arcseconds. Its distance is:',
      options: ['5 parsecs', '20 parsecs', '50 parsecs', '200 parsecs'],
      answer: '20 parsecs',
      explanation:
        'Stellar parallax follows d(pc) = 1/p(arcsec): 1 ÷ 0.05 = 20 pc (about 65 light-years).',
    },
    {
      question: 'A star has apparent magnitude m = 8 and absolute magnitude M = 3. Its distance is:',
      options: ['10 parsecs', '100 parsecs', '1,000 parsecs', '10,000 parsecs'],
      answer: '100 parsecs',
      explanation:
        'The distance modulus m - M = 5 log(d/10) gives 8 - 3 = 5, so log(d/10) = 1 and d = 100 pc.',
    },
    {
      question: 'Which of these stars will END its life as a white dwarf?',
      options: ['A 2 M☉ star', 'A 10 M☉ star', 'A 25 M☉ star', 'A 60 M☉ star'],
      answer: 'A 2 M☉ star',
      explanation:
        'Only stars below roughly 8 M☉ shed their envelopes as planetary nebulae and leave white dwarfs. The 10 M☉ star ends as a neutron star; the 25 and 60 M☉ stars collapse into black holes.',
    },
  ],
  'Disease Detectives': [
    SAMPLE_QUESTIONS['Disease Detectives'],
    {
      question: 'Which measure of association is appropriate for a case-control study?',
      options: ['Relative risk', 'Odds ratio', 'Attack rate', 'Prevalence'],
      answer: 'Odds ratio',
      explanation:
        'Case-control studies sample by outcome, so incidence cannot be computed - use the odds ratio, (a×d)/(b×c) from the 2×2 table. Relative risk requires cohort designs that follow exposed and unexposed groups.',
    },
    {
      question: 'The number of NEW cases in a population during a time period is called:',
      options: ['Prevalence', 'Incidence', 'Case fatality rate', 'Mortality rate'],
      answer: 'Incidence',
      explanation:
        'Incidence counts new cases over a period; prevalence counts all existing cases (new + old) at a point in time - a snapshot.',
    },
    {
      question: 'A doorknob that transmits an infectious agent is an example of a:',
      options: ['Vector', 'Fomite', 'Reservoir', 'Carrier'],
      answer: 'Fomite',
      explanation:
        'A fomite is an inanimate object that carries pathogens (doorknobs, towels, toys). A vector is a living transmitter, like a mosquito; a reservoir is where the pathogen normally lives.',
    },
    {
      question: 'An epi curve shows all cases clustered within one incubation period of a single exposure. This pattern is:',
      options: ['Point source outbreak', 'Continuous common source', 'Propagated outbreak', 'Endemic transmission'],
      answer: 'Point source outbreak',
      explanation:
        'A single exposure produces a sharp rise and quick fall, with all cases inside one incubation period. Continuous sources sustain cases over time; propagated outbreaks show successive, spaced waves from person-to-person spread.',
    },
  ],
  'Dynamic Planet': [
    {
      question: 'The largest reservoir of Earth\u2019s water is:',
      options: ['Glaciers and ice caps', 'Groundwater', 'The oceans', 'Lakes and rivers'],
      answer: 'The oceans',
      explanation:
        'Oceans hold about 97% of Earth\u2019s water. Glaciers hold most of the remaining fresh water (~2%), and groundwater is the largest liquid freshwater store available to people.',
    },
    {
      question: 'The water table is defined as the:',
      options: ['Bottom of the saturated zone', 'Top of the saturated zone', 'Depth where wells stop producing', 'Boundary between fresh and salt water'],
      answer: 'Top of the saturated zone',
      explanation:
        'Below the water table, pore spaces are completely filled with water (saturated zone); above it, pores hold air and water (unsaturated zone). The table rises and falls with recharge and pumping.',
    },
    {
      question: 'Karst topography - caves, sinkholes, and disappearing streams - forms mainly by:',
      options: ['Glacial scouring', 'Dissolution of limestone by acidic water', 'Wind erosion of sandstone', 'Volcanic collapse'],
      answer: 'Dissolution of limestone by acidic water',
      explanation:
        'Slightly acidic groundwater (carbonic acid from CO₂ dissolved in rain) dissolves carbonate rocks like limestone along joints, enlarging them into caves and eventually collapsing surface depressions.',
    },
    {
      question: 'A stream\u2019s "competence" refers to:',
      options: ['Total sediment load carried', 'Largest particle size it can move', 'Dissolved load only', 'Speed of the water'],
      answer: 'Largest particle size it can move',
      explanation:
        'Competence is the biggest particle a stream can transport (it rises steeply with velocity); capacity is the total load it carries. Confusing the two is a classic exam trap.',
    },
    {
      question: 'An artesian well flows without pumping because the aquifer is:',
      options: ['Unconfined and shallow', 'Confined and under pressure', 'Fully depleted', 'Frozen year-round'],
      answer: 'Confined and under pressure',
      explanation:
        'Water in a confined aquifer between impermeable layers is pressurized by recharge at higher elevation; a well puncturing the layer lets water rise - and sometimes flow - on its own.',
    },
  ],
  'Water Quality': [
    {
      question: 'Which water sample holds the MOST dissolved oxygen?',
      options: ['5 °C mountain stream', '15 °C pond', '25 °C lake surface', '35 °C wetland'],
      answer: '5 °C mountain stream',
      explanation:
        'Dissolved oxygen solubility rises as temperature falls - cold water holds more. The 5 °C stream is also turbulent, which keeps it at saturation.',
    },
    {
      question: 'A high EPT index (many mayflies, stoneflies, caddisflies) indicates:',
      options: ['Severe organic pollution', 'Clean, well-oxygenated water', 'High nutrient levels', 'Low pH'],
      answer: 'Clean, well-oxygenated water',
      explanation:
        'EPT counts Ephemeroptera, Plecoptera, and Trichoptera - macroinvertebrates intolerant of pollution and low oxygen. Tubifex worms and blood midges, by contrast, tolerate poor water.',
    },
    {
      question: 'Estuary water is best described as:',
      options: ['Fresh (below 0.5 ppt salt)', 'Brackish (roughly 0.5-30 ppt)', 'Marine (about 35 ppt)', 'Supersaline (above 40 ppt)'],
      answer: 'Brackish (roughly 0.5-30 ppt)',
      explanation:
        'Estuaries mix river water with seawater, so salinity sits between fresh and marine - and varies with depth, tide, and season, which is why estuary species are specially adapted.',
    },
    {
      question: 'Spring tides (largest tidal range) occur near:',
      options: ['First and third quarter moons', 'New and full moons', 'Solar eclipses only', 'The solstices'],
      answer: 'New and full moons',
      explanation:
        'When the Sun, Moon, and Earth align (new/full moon), solar and lunar tidal forces add together. Quarter moons put them at right angles, producing smaller neap tides. "Spring" refers to springing up - not the season.',
    },
    {
      question: 'Water is considered hypoxic - stressing most aquatic life - below about:',
      options: ['8 mg/L dissolved oxygen', '5 mg/L dissolved oxygen', '2 mg/L dissolved oxygen', '0.5 mg/L dissolved oxygen'],
      answer: '2 mg/L dissolved oxygen',
      explanation:
        'Below ~2 mg/L, water is hypoxic and most fish and invertebrates flee or die; dead zones form when algal blooms decay and consume oxygen. Healthy waters support diverse life at 5+ mg/L.',
    },
  ],
  Codebusters: [
    {
      question: 'Decode "FRPSXWHU" (Caesar shift of 3).',
      options: ['COMPUTER', 'CALCULATOR', 'CONSUMER', 'COMPILER'],
      answer: 'COMPUTER',
      explanation:
        'Shift each letter back by 3: F→C, R→O, P→M, S→P, X→U, W→T, H→E, U→R. Caesar shifts have only 25 keys, so trying shifts until words appear works quickly.',
    },
    {
      question: 'Atbash decodes "GSV" as:',
      options: ['THE', 'AND', 'NOT', 'FOR'],
      answer: 'THE',
      explanation:
        'Atbash mirrors the alphabet (A↔Z, B↔Y, ...): G→T, S→H, V→E. Applying Atbash twice returns the original, so it is its own inverse.',
    },
    {
      question: 'Using the Vigenère keyword KEY (A=0 convention), the plaintext "AT" encrypts to:',
      options: ['KX', 'OD', 'KY', 'LB'],
      answer: 'KX',
      explanation:
        'A(0)+K(10)=K and T(19)+E(4)=X mod 26. Under Science Olympiad rules the key advances only on letters, not spaces.',
    },
    {
      question: 'Which value of "a" is INVALID in an affine cipher x → (ax + b) mod 26?',
      options: ['a = 1', 'a = 3', 'a = 2', 'a = 5'],
      answer: 'a = 2',
      explanation:
        '"a" must be coprime with 26 so every letter maps to a unique letter and decryption exists. Even values share the factor 2 with 26 and fail; 1, 3, and 5 all work.',
    },
    {
      question: 'In a Spanish xenocrypt, the most frequent letters are typically:',
      options: ['E, then A and O', 'T, then A and O', 'E, then T and A', 'A, then E and I'],
      answer: 'E, then A and O',
      explanation:
        'Spanish letter frequency runs roughly E, A, O - different from English ETAOIN. Common Spanish words to look for: DE, LA, EL, QUE, EN.',
    },
  ],
  'Rocks and Minerals': [
    {
      question: 'A mineral scratches glass but is scratched by quartz. Its Mohs hardness is most likely:',
      options: ['3 (calcite)', '6 (orthoclase)', '7 (quartz)', '8 (topaz)'],
      answer: '6 (orthoclase)',
      explanation:
        'Glass is about 5.5 and quartz is 7, so the mineral must fall between them - hardness 6. Reference points: fingernail ~2.5, copper penny ~3.5, glass ~5.5, steel file ~6.5.',
    },
    {
      question: 'A mineral that breaks with smooth, curved, shell-like surfaces shows:',
      options: ['Cleavage', 'Conchoidal fracture', 'Foliation', 'Luster'],
      answer: 'Conchoidal fracture',
      explanation:
        'Conchoidal fracture (from "shell") breaks along curved surfaces with no preferred plane - classic in quartz and obsidian. Cleavage, by contrast, breaks on flat, repeated planes.',
    },
    {
      question: 'An intrusive igneous rock that cooled slowly deep underground, growing large crystals, is:',
      options: ['Basalt', 'Granite', 'Obsidian', 'Pumice'],
      answer: 'Granite',
      explanation:
        'Slow cooling lets crystals grow large and interlocking - granite. Basalt (extrusive) cools fast at the surface with fine grains; obsidian and pumice cool so fast they are glassy or bubbly.',
    },
    {
      question: 'A metamorphic rock with segregated light and dark mineral bands is:',
      options: ['Marble', 'Quartzite', 'Gneiss', 'Slate'],
      answer: 'Gneiss',
      explanation:
        'Gneissic banding forms under high-grade heat and pressure as light (feldspar/quartz) and dark (mica/amphibole) minerals separate into layers. Marble and quartzite are non-foliated; slate is low-grade foliated.',
    },
    {
      question: 'Hematite\u2019s streak (powder color on a porcelain plate) is:',
      options: ['Black', 'Metallic silver', 'Reddish-brown', 'Colorless'],
      answer: 'Reddish-brown',
      explanation:
        'Streak is more reliable than surface color: hematite specimens can look metallic gray or red, but all leave a reddish-brown streak - it is the main ore of iron and the pigment in "red ochre."',
    },
  ],
  Meteorology: [
    {
      question: 'A tornado WARNING means:',
      options: [
        'Conditions are favorable for tornadoes',
        'A tornado has been sighted or is indicated on radar',
        'A tornado watch has expired',
        'Tornadoes are possible next week',
      ],
      answer: 'A tornado has been sighted or is indicated on radar',
      explanation:
        'Watch = favorable conditions, be prepared (broad area, longer window). Warning = happening or imminent, take shelter NOW (small area, short window). The most-tested distinction in severe weather.',
    },
    {
      question: 'The rotating updraft at the heart of a supercell thunderstorm is the:',
      options: ['Mesoscale convective complex', 'Mesocyclone', 'Microburst', 'Derecho'],
      answer: 'Mesocyclone',
      explanation:
        'Wind shear tilts and rolls horizontal vorticity into the vertical, spinning the updraft. A wall cloud may lower from it before a tornado descends.',
    },
    {
      question: 'Sustained winds of 115 mph make a hurricane which Saffir-Simpson category?',
      options: ['Category 2', 'Category 3', 'Category 4', 'Category 5'],
      answer: 'Category 3',
      explanation:
        'Categories by sustained wind: 1 (74-95), 2 (96-110), 3 (111-129), 4 (130-156), 5 (157+ mph). Category 3 and above are "major" hurricanes - and 115 mph sits in Category 3.',
    },
    {
      question: 'You count 10 seconds between a lightning flash and its thunder. About how far away was the strike?',
      options: ['1 mile', '2 miles', '5 miles', '10 miles'],
      answer: '2 miles',
      explanation:
        'Sound travels about 1 mile per 5 seconds (1 km per 3 seconds): 10 ÷ 5 = 2 miles. If you hear thunder, you are within striking distance - go indoors.',
    },
    {
      question: 'Enhanced Fujita (EF) ratings are assigned based on:',
      options: ['Measured wind speed', 'Doppler radar velocity', 'Observed damage', 'Barometric pressure'],
      answer: 'Observed damage',
      explanation:
        'The EF scale rates tornadoes EF0-EF5 by the damage surveyors observe, which implies wind speed. Radar and pressure are useful but do not set the rating.',
    },
  ],
};

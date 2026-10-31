// Official 2027 Science Olympiad season data (soinc.org yearly event
// slate, published 2026-05-05). Divisions and season themes are rules-
// manual facts - keep this file in sync with soinc.org if the slate is
// corrected mid-season.

/** Season theme/topic note for events whose 2027 rules specify one. */
export const SEASON_2027_THEMES: Record<string, string> = {
  'Anatomy and Physiology': 'Digestive, Immune, Respiratory',
  'Dynamic Planet': "Earth's Fresh Waters",
  Meteorology: 'Severe Storms',
  'Water Quality': 'Marine & Estuaries',
  'Chemistry Lab': 'Kinetics and Gases',
};

/** Which division(s) each DEFAULT_TOPICS event runs in for 2027.
 * 'past' = not on the 2027 slate (still valid practice material from
 * recent seasons; the pages stay up, labeled as past-season). */
export type Division = 'B' | 'C' | 'BC' | 'past';

export const SEASON_2027_DIVISIONS: Record<string, Division> = {
  'Anatomy and Physiology': 'BC',
  Astronomy: 'C',
  Botany: 'BC',
  'Chemistry Lab': 'C',
  'Circuit Lab': 'BC',
  Codebusters: 'BC',
  'Crime Busters': 'B',
  'Designer Genes': 'C',
  'Disease Detectives': 'BC',
  'Dynamic Planet': 'BC',
  Ecology: 'past',
  'Experimental Design': 'BC',
  'Fermi Questions': 'past',
  'Food Science': 'B',
  Forensics: 'C',
  Fossils: 'past',
  Heredity: 'B',
  Machines: 'past',
  Meteorology: 'B',
  'Microbe Mission': 'past',
  Optics: 'past',
  Ornithology: 'past',
  'Protein Modeling': 'C',
  'Reach for the Stars': 'past',
  'Remote Sensing': 'BC',
  'Rocks and Minerals': 'BC',
  'Solar System': 'B',
  Thermodynamics: 'BC',
  Tower: 'past',
  'Water Quality': 'BC',
  'Wind Power': 'past',
  'Write It Do It': 'B',
};

/** The full official 2027 rosters (23 events per division, soinc.org),
 * grouped by the official categories, for the season page. Order follows
 * the official slate. Build/hands-on events this site does not cover yet
 * are still listed for completeness; the page links the ones we do. */
export const DIVISION_B_2027: { category: string; events: string[] }[] = [
  {
    category: 'Life, Personal & Social Science',
    events: ['Anatomy and Physiology', 'Botany', 'Disease Detectives', 'Heredity', 'Water Quality'],
  },
  {
    category: 'Earth and Space Science',
    events: ['Dynamic Planet', 'Meteorology', 'Remote Sensing', 'Rocks and Minerals', 'Solar System'],
  },
  {
    category: 'Physical Science & Chemistry',
    events: ['Circuit Lab', 'Crime Busters', 'Food Science', 'Hovercraft', 'Thermodynamics'],
  },
  {
    category: 'Technology & Engineering',
    events: ['Boomilever', 'Elastic Launch Glider', 'Roller Coaster', 'Scrambler'],
  },
  {
    category: 'Inquiry & Nature of Science',
    events: ['Codebusters', 'Experimental Design', 'Ping Pong Parachute', 'Write It Do It'],
  },
];

export const DIVISION_C_2027: { category: string; events: string[] }[] = [
  {
    category: 'Life, Personal & Social Science',
    events: ['Anatomy and Physiology', 'Botany', 'Designer Genes', 'Disease Detectives', 'Water Quality'],
  },
  {
    category: 'Earth and Space Science',
    events: ['Astronomy', 'Dynamic Planet', 'Remote Sensing', 'Rocks and Minerals'],
  },
  {
    category: 'Physical Science & Chemistry',
    events: ['Chemistry Lab', 'Circuit Lab', 'Forensics', 'Hovercraft', 'Thermodynamics'],
  },
  {
    category: 'Technology & Engineering',
    events: ['Boomilever', 'Electric Vehicle', 'Mission Possible', 'Wright Stuff'],
  },
  {
    category: 'Inquiry & Nature of Science',
    events: ['Codebusters', 'Engineering CAD', 'Experimental Design', 'Ping Pong Parachute', 'Protein Modeling'],
  },
];

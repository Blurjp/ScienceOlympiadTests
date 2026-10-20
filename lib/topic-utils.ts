// Canonical topic names used throughout the application
// All topic variations should be normalized to these values

export const CANONICAL_TOPICS = [
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
  'Remote Sensing',
  'Solar System',
  'Thermodynamics',
  'Water Quality',
  'Write It Do It',
] as const;

export type CanonicalTopic = typeof CANONICAL_TOPICS[number];

// Map of all known topic variations to their canonical form
const TOPIC_NORMALIZATION_MAP: Record<string, CanonicalTopic> = {
  // Anatomy and Physiology variations
  'anatomy and physiology': 'Anatomy and Physiology',
  'anatomy & physiology': 'Anatomy and Physiology',
  'anatomy': 'Anatomy and Physiology',
  'a&p': 'Anatomy and Physiology',
  'cell biology': 'Anatomy and Physiology',
  // Note: protein modeling is its own Division C event, defined below

  // Astronomy variations
  'astronomy': 'Astronomy',
  'starry night': 'Astronomy',
  // Note: solar system is its own Division B event, defined below

  // Botany variations
  'botany': 'Botany',
  'plant science': 'Botany',
  'plants': 'Botany',

  // Chemistry Lab variations
  'chemistry lab': 'Chemistry Lab',
  'chem lab': 'Chemistry Lab',
  'chemistry': 'Chemistry Lab',

  // Circuit Lab variations
  'circuit lab': 'Circuit Lab',
  'circuits': 'Circuit Lab',
  'electricity': 'Circuit Lab',
  'electronics': 'Circuit Lab',

  // Codebusters variations
  'codebusters': 'Codebusters',
  'code busters': 'Codebusters',
  'codebuster': 'Codebusters',
  'ciphers': 'Codebusters',
  'cryptanalysis': 'Codebusters',

  // Crime Busters variations
  'crime busters': 'Crime Busters',
  'crimebusters': 'Crime Busters',

  // Designer Genes variations
  'designer genes': 'Designer Genes',
  'genomics': 'Designer Genes',

  // Disease Detectives variations
  'disease detectives': 'Disease Detectives',
  'epidemiology': 'Disease Detectives',

  // Dynamic Planet variations
  'dynamic planet': 'Dynamic Planet',
  'earth science': 'Dynamic Planet',
  'geology': 'Dynamic Planet',
  'geologic mapping': 'Dynamic Planet',
  // Note: rocks and minerals is its own event, defined below

  // Ecology variations
  'ecology': 'Ecology',
  'herpetology': 'Ecology',
  'entomology': 'Ecology',
  'green generation': 'Ecology',
  // Note: ornithology is its own event, defined below
  // Note: water quality is its own event, defined below

  // Experimental Design variations
  'experimental design': 'Experimental Design',
  'exp design': 'Experimental Design',
  'expd': 'Experimental Design',

  // Fermi Questions variations
  'fermi questions': 'Fermi Questions',
  'fermi': 'Fermi Questions',

  // Food Science variations
  'food science': 'Food Science',
  'food sci': 'Food Science',
  'food chemistry': 'Food Science',
  'dairy science': 'Food Science',
  'dairy': 'Food Science',
  'dairy products': 'Food Science',

  // Forensics variations
  'forensics': 'Forensics',
  // Note: crime busters is its own Division B event, defined above

  // Fossils variations
  'fossils': 'Fossils',
  'paleontology': 'Fossils',

  // Heredity variations
  'heredity': 'Heredity',
  'genetics': 'Heredity',

  // Machines variations
  'machines': 'Machines',
  'simple machines': 'Machines',
  'compound machines': 'Machines',
  'detector building': 'Machines',
  'mousetrap vehicle': 'Machines',
  'electric vehicle': 'Machines',
  // Note: wind power and tower are their own events, defined below

  // Microbe Mission variations
  'microbe mission': 'Microbe Mission',
  'microbiology': 'Microbe Mission',
  'disease science': 'Microbe Mission',

  // Meteorology variations
  'meteorology': 'Meteorology',
  'weather': 'Meteorology',
  'weather and climate': 'Meteorology',
  'severe weather': 'Meteorology',

  // Optics variations
  'optics': 'Optics',
  'light': 'Optics',

  // Ornithology variations
  'ornithology': 'Ornithology',
  'birds': 'Ornithology',

  // Protein Modeling variations
  'protein modeling': 'Protein Modeling',
  'protein structure': 'Protein Modeling',

  // Remote Sensing variations
  'remote sensing': 'Remote Sensing',
  'satellite imagery': 'Remote Sensing',

  // Solar System variations
  'solar system': 'Solar System',
  'planetary science': 'Solar System',

  // Thermodynamics variations
  'thermodynamics': 'Thermodynamics',
  'thermo': 'Thermodynamics',
  'heat transfer': 'Thermodynamics',
  'keep the heat': 'Thermodynamics',

  // Write It Do It variations
  'write it do it': 'Write It Do It',
  'widi': 'Write It Do It',
  'write it, do it': 'Write It Do It',

  // Water Quality variations
  'water quality': 'Water Quality',
  'aquatic ecology': 'Water Quality',
};

/**
 * Normalize a topic name to its canonical form
 * Returns the canonical topic name, or the original if not found
 */
export function normalizeTopic(topic: string): string {
  const normalized = topic.trim().toLowerCase();
  return TOPIC_NORMALIZATION_MAP[normalized] || topic;
}

/**
 * Check if a topic is valid (matches a canonical topic)
 */
export function isValidTopic(topic: string): boolean {
  const normalized = normalizeTopic(topic);
  return CANONICAL_TOPICS.includes(normalized as CanonicalTopic);
}

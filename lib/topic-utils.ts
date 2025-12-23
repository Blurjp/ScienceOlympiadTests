// Canonical topic names used throughout the application
// All topic variations should be normalized to these values

export const CANONICAL_TOPICS = [
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
  'protein modeling': 'Anatomy and Physiology',
  'cell biology': 'Anatomy and Physiology',

  // Astronomy variations
  'astronomy': 'Astronomy',
  'reach for the stars': 'Astronomy',
  'solar system': 'Astronomy',
  'starry night': 'Astronomy',

  // Chemistry Lab variations
  'chemistry lab': 'Chemistry Lab',
  'chem lab': 'Chemistry Lab',
  'chemistry': 'Chemistry Lab',
  'thermodynamics': 'Chemistry Lab',

  // Disease Detectives variations
  'disease detectives': 'Disease Detectives',
  'epidemiology': 'Disease Detectives',

  // Dynamic Planet variations
  'dynamic planet': 'Dynamic Planet',
  'rocks and minerals': 'Dynamic Planet',
  'earth science': 'Dynamic Planet',
  'geology': 'Dynamic Planet',
  'geologic mapping': 'Dynamic Planet',

  // Ecology variations
  'ecology': 'Ecology',
  'herpetology': 'Ecology',
  'entomology': 'Ecology',
  'green generation': 'Ecology',
  'water quality': 'Ecology',
  // Note: ornithology is its own event, defined below

  // Experimental Design variations
  'experimental design': 'Experimental Design',
  'exp design': 'Experimental Design',
  'expd': 'Experimental Design',

  // Fermi Questions variations
  'fermi questions': 'Fermi Questions',
  'fermi': 'Fermi Questions',

  // Forensics variations
  'forensics': 'Forensics',
  'crime busters': 'Forensics',

  // Fossils variations
  'fossils': 'Fossils',
  'paleontology': 'Fossils',

  // Machines variations
  'machines': 'Machines',
  'simple machines': 'Machines',
  'compound machines': 'Machines',
  'wind power': 'Machines',
  'tower': 'Machines',
  'detector building': 'Machines',
  'mousetrap vehicle': 'Machines',
  'electric vehicle': 'Machines',

  // Microbe Mission variations
  'microbe mission': 'Microbe Mission',
  'microbiology': 'Microbe Mission',
  'disease science': 'Microbe Mission',

  // Optics variations
  'optics': 'Optics',
  'light': 'Optics',

  // Ornithology variations
  'ornithology': 'Ornithology',
  'birds': 'Ornithology',

  // Write It Do It variations
  'write it do it': 'Write It Do It',
  'widi': 'Write It Do It',
  'write it, do it': 'Write It Do It',
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

/**
 * Get all variations that map to a canonical topic
 */
export function getTopicVariations(canonicalTopic: CanonicalTopic): string[] {
  return Object.entries(TOPIC_NORMALIZATION_MAP)
    .filter(([_, canonical]) => canonical === canonicalTopic)
    .map(([variation, _]) => variation);
}

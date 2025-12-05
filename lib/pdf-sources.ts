// Curated list of publicly available Science Olympiad exam PDFs
// These are links to third-party sources where exams are publicly posted
// SciOlyPrep does not host, store, or redistribute these PDFs

export interface PDFSource {
  id: string;
  name: string;
  url: string;
  topic: string;
  year: number;
  level: 'Invitational' | 'Regional' | 'State' | 'National';
  source: string;
  description: string;
}

export const CURATED_PDF_SOURCES: PDFSource[] = [
  // Scioly.org hosted exams (publicly shared by community)
  {
    id: 'scioly-anatomy-2023-inv',
    name: 'Anatomy & Physiology - Sample Invitational 2023',
    url: 'https://scioly.org/tests/anatomy-invitational-2023.pdf',
    topic: 'Anatomy and Physiology',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Community-shared invitational exam covering nervous and immune systems',
  },
  {
    id: 'scioly-astronomy-2023-inv',
    name: 'Astronomy - Sample Invitational 2023',
    url: 'https://scioly.org/tests/astronomy-invitational-2023.pdf',
    topic: 'Astronomy',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Community-shared invitational exam on stellar evolution and DSOs',
  },
  {
    id: 'scioly-chemistry-2023-inv',
    name: 'Chemistry Lab - Sample Invitational 2023',
    url: 'https://scioly.org/tests/chemistry-invitational-2023.pdf',
    topic: 'Chemistry Lab',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Community-shared invitational exam on organic chemistry',
  },
  {
    id: 'scioly-fossils-2023-inv',
    name: 'Fossils - Sample Invitational 2023',
    url: 'https://scioly.org/tests/fossils-invitational-2023.pdf',
    topic: 'Fossils',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Community-shared invitational exam on paleontology',
  },
  {
    id: 'scioly-ecology-2023-inv',
    name: 'Ecology - Sample Invitational 2023',
    url: 'https://scioly.org/tests/ecology-invitational-2023.pdf',
    topic: 'Ecology',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Community-shared invitational exam on ecosystems',
  },
  // Regional level samples
  {
    id: 'scioly-anatomy-2022-reg',
    name: 'Anatomy & Physiology - Sample Regional 2022',
    url: 'https://scioly.org/tests/anatomy-regional-2022.pdf',
    topic: 'Anatomy and Physiology',
    year: 2022,
    level: 'Regional',
    source: 'Scioly.org Community',
    description: 'Regional-level exam structure reference',
  },
  {
    id: 'scioly-disease-2023-inv',
    name: 'Disease Detectives - Sample Invitational 2023',
    url: 'https://scioly.org/tests/disease-invitational-2023.pdf',
    topic: 'Disease Detectives',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Epidemiology and public health exam structure',
  },
  {
    id: 'scioly-dynamic-2023-inv',
    name: 'Dynamic Planet - Sample Invitational 2023',
    url: 'https://scioly.org/tests/dynamic-invitational-2023.pdf',
    topic: 'Dynamic Planet',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Earth science and geology exam structure',
  },
  {
    id: 'scioly-forensics-2023-inv',
    name: 'Forensics - Sample Invitational 2023',
    url: 'https://scioly.org/tests/forensics-invitational-2023.pdf',
    topic: 'Forensics',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Crime scene analysis exam structure',
  },
  {
    id: 'scioly-optics-2023-inv',
    name: 'Optics - Sample Invitational 2023',
    url: 'https://scioly.org/tests/optics-invitational-2023.pdf',
    topic: 'Optics',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Community',
    description: 'Light and optics exam structure',
  },
];

// Get sources filtered by topic
export function getSourcesByTopic(topic: string): PDFSource[] {
  return CURATED_PDF_SOURCES.filter(s => s.topic === topic);
}

// Get sources filtered by level
export function getSourcesByLevel(level: PDFSource['level']): PDFSource[] {
  return CURATED_PDF_SOURCES.filter(s => s.level === level);
}

// Get source by ID
export function getSourceById(id: string): PDFSource | undefined {
  return CURATED_PDF_SOURCES.find(s => s.id === id);
}

// Get all unique topics
export function getAvailableTopics(): string[] {
  return [...new Set(CURATED_PDF_SOURCES.map(s => s.topic))];
}

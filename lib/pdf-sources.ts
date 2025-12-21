// Curated list of Science Olympiad exam structure templates
// These are used to inspire AI-generated original questions
// All generated questions are 100% original - no content is copied

// Link to the Test Exchange Archive where users can find real exams
export const TEST_EXCHANGE_ARCHIVE_URL = 'https://scioly.org/wiki/Test_Exchange_Archive';

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
  // Exam structure templates inspired by Scioly.org community exams
  {
    id: 'scioly-anatomy-2023-inv',
    name: 'Anatomy & Physiology - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Anatomy and Physiology',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Invitational-level structure covering nervous and immune systems',
  },
  {
    id: 'scioly-astronomy-2023-inv',
    name: 'Astronomy - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Astronomy',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Invitational-level structure on stellar evolution and DSOs',
  },
  {
    id: 'scioly-chemistry-2023-inv',
    name: 'Chemistry Lab - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Chemistry Lab',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Invitational-level structure on organic chemistry',
  },
  {
    id: 'scioly-fossils-2023-inv',
    name: 'Fossils - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Fossils',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Invitational-level structure on paleontology',
  },
  {
    id: 'scioly-ecology-2023-inv',
    name: 'Ecology - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Ecology',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Invitational-level structure on ecosystems',
  },
  // Regional level templates
  {
    id: 'scioly-anatomy-2022-reg',
    name: 'Anatomy & Physiology - Regional Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Anatomy and Physiology',
    year: 2022,
    level: 'Regional',
    source: 'Scioly.org Test Exchange',
    description: 'Regional-level exam structure reference',
  },
  {
    id: 'scioly-disease-2023-inv',
    name: 'Disease Detectives - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Disease Detectives',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Epidemiology and public health exam structure',
  },
  {
    id: 'scioly-dynamic-2023-inv',
    name: 'Dynamic Planet - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Dynamic Planet',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Earth science and geology exam structure',
  },
  {
    id: 'scioly-forensics-2023-inv',
    name: 'Forensics - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Forensics',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
    description: 'Crime scene analysis exam structure',
  },
  {
    id: 'scioly-optics-2023-inv',
    name: 'Optics - Invitational Style',
    url: TEST_EXCHANGE_ARCHIVE_URL,
    topic: 'Optics',
    year: 2023,
    level: 'Invitational',
    source: 'Scioly.org Test Exchange',
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
  return Array.from(new Set(CURATED_PDF_SOURCES.map(s => s.topic)));
}

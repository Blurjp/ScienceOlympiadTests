import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  saveReferenceQuestion,
  saveReferenceQuestionsBatch,
  getReferenceQuestionStats,
  ReferenceQuestion
} from '@/lib/database';

// This is an admin-only endpoint to scrape and import historical tests
// It's used to populate the reference_questions database

interface ScrapedTestLink {
  topic: string;
  year?: number;
  tournament?: string;
  division?: string;
  type: 'test' | 'key' | 'answer_sheet' | 'unknown';
  url: string;
  title: string;
}

// Map Test Exchange topic names to our standard topics
const TOPIC_MAPPING: Record<string, string> = {
  'anatomy': 'Anatomy & Physiology',
  'anatomy and physiology': 'Anatomy & Physiology',
  'astronomy': 'Astronomy',
  'chemistry lab': 'Chemistry Lab',
  'chem lab': 'Chemistry Lab',
  'disease detectives': 'Disease Detectives',
  'dynamic planet': 'Dynamic Planet',
  'ecology': 'Ecology',
  'experimental design': 'Experimental Design',
  'exp design': 'Experimental Design',
  'fermi questions': 'Fermi Questions',
  'fermi': 'Fermi Questions',
  'forensics': 'Forensics',
  'fossils': 'Fossils',
  'machines': 'Machines',
  'simple machines': 'Machines',
  'compound machines': 'Machines',
  'microbe mission': 'Microbe Mission',
  'optics': 'Optics',
  'ornithology': 'Ornithology',
  'reach for the stars': 'Astronomy',
  'rocks and minerals': 'Dynamic Planet',
  'wind power': 'Machines',
  'write it do it': 'Write It Do It',
  'tower': 'Machines',
  'detector building': 'Machines',
  'crime busters': 'Forensics',
  'herpetology': 'Ecology',
  'entomology': 'Ecology',
  'green generation': 'Ecology',
  'water quality': 'Ecology',
  'thermodynamics': 'Chemistry Lab',
  'protein modeling': 'Anatomy & Physiology',
  'cell biology': 'Anatomy & Physiology',
};

// Parse the Test Exchange Archive HTML to extract test links
function parseTestExchangeHTML(html: string): ScrapedTestLink[] {
  const links: ScrapedTestLink[] = [];

  // Find all links in the HTML
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  // Current section context
  let currentTopic = '';

  // Look for section headers to determine topic
  const sectionRegex = /<h[23][^>]*>([^<]+)<\/h[23]>/gi;
  const sections: { topic: string; position: number }[] = [];

  while ((match = sectionRegex.exec(html)) !== null) {
    const headerText = match[1].toLowerCase().trim();

    // Check if this matches a known topic
    for (const [key, value] of Object.entries(TOPIC_MAPPING)) {
      if (headerText.includes(key)) {
        sections.push({ topic: value, position: match.index });
        break;
      }
    }
  }

  // Now find all links and associate them with topics
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();

    // Skip navigation and non-test links
    if (url.startsWith('#') ||
        url.includes('edit') ||
        url.includes('wiki/index') ||
        url.includes('Special:') ||
        title.length < 3) {
      continue;
    }

    // Only process Google Drive links and PDFs
    if (!url.includes('drive.google.com') &&
        !url.includes('.pdf') &&
        !url.includes('dropbox') &&
        !url.includes('docs.google.com')) {
      continue;
    }

    // Determine current topic based on position
    let topic = 'Unknown';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (match.index > sections[i].position) {
        topic = sections[i].topic;
        break;
      }
    }

    // Parse year from title
    const yearMatch = title.match(/20\d{2}|19\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

    // Parse tournament/invitational name
    const tournamentPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Invitational|Invi|Regional|State|National)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+20\d{2}/i,
    ];

    let tournament = '';
    for (const pattern of tournamentPatterns) {
      const tournamentMatch = title.match(pattern);
      if (tournamentMatch) {
        tournament = tournamentMatch[1].trim();
        break;
      }
    }

    // Determine type (test, key, answer sheet)
    let type: 'test' | 'key' | 'answer_sheet' | 'unknown' = 'unknown';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('key') || lowerTitle.includes('answer')) {
      type = lowerTitle.includes('sheet') ? 'answer_sheet' : 'key';
    } else if (lowerTitle.includes('test') || lowerTitle.includes('exam')) {
      type = 'test';
    }

    // Determine division
    let division = '';
    if (title.includes('Div B') || title.includes('Division B') || title.includes(' B ')) {
      division = 'B';
    } else if (title.includes('Div C') || title.includes('Division C') || title.includes(' C ')) {
      division = 'C';
    }

    links.push({
      topic,
      year,
      tournament,
      division,
      type,
      url,
      title,
    });
  }

  return links;
}

// Convert difficulty based on tournament level
function getDifficultyFromTournament(tournament: string, title: string): 'Invitational' | 'Regional' | 'State' | 'National' {
  const lowerTitle = (tournament + ' ' + title).toLowerCase();

  if (lowerTitle.includes('national') || lowerTitle.includes('nationals')) {
    return 'National';
  }
  if (lowerTitle.includes('state') || lowerTitle.includes('states')) {
    return 'State';
  }
  if (lowerTitle.includes('regional') || lowerTitle.includes('regionals')) {
    return 'Regional';
  }
  return 'Invitational';
}

// Scrape the Test Exchange Archive
async function scrapeTestExchangeArchive(): Promise<ScrapedTestLink[]> {
  try {
    const response = await fetch('https://scioly.org/wiki/index.php/Test_Exchange_Archive', {
      headers: {
        'User-Agent': 'SciOlyTestApp/1.0 (Educational Purpose)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    return parseTestExchangeHTML(html);
  } catch (error) {
    console.error('Error scraping Test Exchange Archive:', error);
    throw error;
  }
}

// Store scraped links as reference questions metadata (for later PDF parsing)
async function storeScrapedLinks(links: ScrapedTestLink[]): Promise<{
  stored: number;
  skipped: number;
  byTopic: Record<string, number>;
}> {
  // This stores the links for later processing
  // In production, you would parse the PDFs to extract actual questions

  // For now, create placeholder reference entries
  // These will be enriched when PDFs are actually parsed

  const byTopic: Record<string, number> = {};
  let stored = 0;
  let skipped = 0;

  for (const link of links) {
    // Only process test files (not keys or answer sheets yet)
    if (link.type !== 'test' && link.type !== 'unknown') {
      skipped++;
      continue;
    }

    // Skip if topic is unknown
    if (link.topic === 'Unknown') {
      skipped++;
      continue;
    }

    byTopic[link.topic] = (byTopic[link.topic] || 0) + 1;
    stored++;

    // Note: In production, we would actually parse the PDF here
    // For now, just logging the found tests
    console.log(`Found test: ${link.topic} - ${link.title} (${link.year})`);
  }

  return { stored, skipped, byTopic };
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow specific admin emails (you should configure this)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current stats
    const stats = await getReferenceQuestionStats();

    return NextResponse.json({
      message: 'Reference questions database stats',
      stats,
    });
  } catch (error: any) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow specific admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'scrape') {
      // Scrape the Test Exchange Archive
      const links = await scrapeTestExchangeArchive();
      const result = await storeScrapedLinks(links);

      return NextResponse.json({
        message: 'Scraping complete',
        totalLinksFound: links.length,
        ...result,
      });
    }

    if (action === 'import-questions') {
      // Import questions directly (from parsed PDFs or manual entry)
      const { questions } = body as { questions: ReferenceQuestion[] };

      if (!questions || !Array.isArray(questions)) {
        return NextResponse.json({ error: 'questions array required' }, { status: 400 });
      }

      const imported = await saveReferenceQuestionsBatch(questions);

      return NextResponse.json({
        message: 'Import complete',
        imported,
        total: questions.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in scrape-tests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

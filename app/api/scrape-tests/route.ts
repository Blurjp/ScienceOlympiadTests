import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  saveReferenceQuestionsBatch,
  getReferenceQuestionStats,
  ReferenceQuestion,
  saveScrapedTestsBatch,
  getScrapedTestStats,
  ScrapedTest,
} from '@/lib/database';
import { normalizeTopic, isValidTopic } from '@/lib/topic-utils';

// This is an admin-only endpoint to scrape and import historical tests
// It's used to populate the scraped_tests and reference_questions databases

interface ScrapedTestLink {
  topic: string;
  year?: number;
  tournament?: string;
  division?: string;
  type: 'test' | 'key' | 'answer_sheet' | 'unknown';
  url: string;
  title: string;
}

// Parse the Test Exchange Archive HTML to extract test links
function parseTestExchangeHTML(html: string): ScrapedTestLink[] {
  const links: ScrapedTestLink[] = [];

  // Extract text content and links more robustly
  // First, find section headers to determine topic context
  const sections: { topic: string; position: number }[] = [];

  // Match headers with possible nested elements (using [\s\S] instead of 's' flag for dotAll)
  const headerRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let headerMatch;

  while ((headerMatch = headerRegex.exec(html)) !== null) {
    // Strip HTML tags from header content
    const headerText = headerMatch[1].replace(/<[^>]+>/g, '').toLowerCase().trim();

    // Try to normalize the header text as a topic
    const normalizedTopic = normalizeTopic(headerText);
    if (isValidTopic(normalizedTopic)) {
      sections.push({ topic: normalizedTopic, position: headerMatch.index });
    }
  }

  // Find all links - use a more robust regex that handles nested elements
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;

  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const url = linkMatch[1];
    // Strip HTML tags from link text
    const title = linkMatch[2].replace(/<[^>]+>/g, '').trim();

    // Skip navigation and non-test links
    if (url.startsWith('#') ||
        url.includes('edit') ||
        url.includes('wiki/index') ||
        url.includes('Special:') ||
        url.includes('action=') ||
        title.length < 3) {
      continue;
    }

    // Only process Google Drive links, PDFs, and Dropbox
    if (!url.includes('drive.google.com') &&
        !url.includes('.pdf') &&
        !url.includes('dropbox') &&
        !url.includes('docs.google.com')) {
      continue;
    }

    // Determine current topic based on position
    let topic = 'Unknown';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (linkMatch.index > sections[i].position) {
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

// Store scraped links to the scraped_tests table
async function storeScrapedLinks(links: ScrapedTestLink[]): Promise<{
  inserted: number;
  skipped: number;
  byTopic: Record<string, number>;
}> {
  const byTopic: Record<string, number> = {};

  // Filter to only tests with known topics
  const testsToStore: ScrapedTest[] = [];
  let preFilterSkipped = 0;

  for (const link of links) {
    // Skip if topic is unknown
    if (link.topic === 'Unknown' || !isValidTopic(link.topic)) {
      preFilterSkipped++;
      continue;
    }

    byTopic[link.topic] = (byTopic[link.topic] || 0) + 1;

    testsToStore.push({
      topic: link.topic, // Already normalized in parseTestExchangeHTML
      year: link.year,
      tournament: link.tournament,
      division: link.division,
      testType: link.type,
      url: link.url,
      title: link.title,
    });
  }

  // Batch save to database
  const result = await saveScrapedTestsBatch(testsToStore);

  return {
    inserted: result.inserted,
    skipped: result.skipped + preFilterSkipped,
    byTopic,
  };
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

    // Get current stats for both tables
    const referenceStats = await getReferenceQuestionStats();
    const scrapedStats = await getScrapedTestStats();

    return NextResponse.json({
      message: 'Test database stats',
      referenceQuestions: referenceStats,
      scrapedTests: scrapedStats,
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
      // Scrape the Test Exchange Archive and persist to scraped_tests table
      const links = await scrapeTestExchangeArchive();
      const result = await storeScrapedLinks(links);

      return NextResponse.json({
        message: 'Scraping complete - test metadata stored in database',
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

    return NextResponse.json({ error: 'Invalid action. Use "scrape" or "import-questions"' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in scrape-tests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

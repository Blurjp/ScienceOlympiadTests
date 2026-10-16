import { getSiteUrl } from '@/lib/site';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { TOPIC_DESCRIPTIONS } from '@/lib/topic-descriptions';
import { slugifyTopic, eventFaq } from '@/lib/event-pages';

// llms-full.txt: the complete text content of the site's public pages in a
// single plain-markdown document, so LLM agents can ingest everything in one
// fetch instead of crawling page by page. Bump LAST_UPDATED with content.
const LAST_UPDATED = '2026-10-16';

export function GET() {
  const base = getSiteUrl();

  const eventSections = DEFAULT_TOPICS.map((topic) => {
    const description =
      TOPIC_DESCRIPTIONS[topic] || `Practice questions for ${topic}.`;
    const faq = eventFaq(topic)
      .map((item) => `Q: ${item.q}\nA: ${item.a}`)
      .join('\n\n');
    return `# ${topic}

Source: ${base}/events/${slugifyTopic(topic)}

## What ${topic} Tests Cover

${description}

## FAQ

${faq}
`;
  }).join('\n---\n\n');

  const body = `# SciolyPrep - Full Site Content

> Machine-readable dump of all public text content on ${base}. Last updated: ${LAST_UPDATED}.

SciolyPrep is a free web app that generates and grades Science Olympiad Division C practice tests with AI, imports past exam PDFs into interactive tests, and tracks progress. 5 free AI test generations per month; paid plans unlock unlimited generations. Operated by Pathvana LLC, support: support@aitrove.ai. Independent platform, not affiliated with Science Olympiad, Inc.

Product facts:

- Questions per test: 5-50, multiple choice with 4 options, AI-graded with partial credit
- Difficulty levels: Invitational (easiest), Regional, State, National (hardest)
- Free tier: 5 AI test generations per month, no credit card required
- Events covered: ${DEFAULT_TOPICS.length} Division C events
- PDF import: upload a past exam PDF from a computer or Google Drive link; every question is parsed into an interactive test
- Exam-Inspired Generator: analyzes real exam structure (topic mix, format, difficulty) and writes original new questions in that style

${eventSections}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

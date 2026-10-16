import { getSiteUrl } from '@/lib/site';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { slugifyTopic } from '@/lib/event-pages';

// llms.txt (llmstxt.org convention): a markdown manifest that LLM agents and
// answer engines can ingest to understand and cite the site accurately.
export function GET() {
  const base = getSiteUrl();
  const eventLinks = DEFAULT_TOPICS.map(
    (t) => `- [${t} practice tests](${base}/events/${slugifyTopic(t)}): AI-generated practice tests and a study guide for the ${t} event, from Invitational to National difficulty.`
  ).join('\n');

  const body = `# Science Olympiad Tests (SciolyPrep)

> A free web app that generates and grades Science Olympiad Division C practice tests with AI, imports past exam PDFs into interactive tests, and tracks progress. 5 free AI test generations per month; paid plans unlock unlimited generations.

SciolyPrep helps Science Olympiad competitors practice for Division C events. It generates original multiple-choice practice questions with verified answers at Invitational, Regional, State, and National difficulty, parses real past-exam PDFs into interactive tests, and produces exam-inspired original tests modeled on real Science Olympiad exam structures. Answer grading uses AI to accept synonyms, abbreviations, and partial credit. The platform is independent and not affiliated with Science Olympiad, Inc.

## Key pages

- [Home / test generator](${base}/): AI test generator, exam-inspired generator, PDF import, test library with history.
- [Event practice tests index](${base}/events): Study guides and practice tests for all ${DEFAULT_TOPICS.length} major Division C events.
${eventLinks}
- [Pricing](${base}/pricing): Free tier (5 AI generations/month), Pro subscription, and Season Pass details.
- [About & event guide](${base}/about): How the app works and what each event tests.
- [Contact](${base}/contact): Support, bug reports, feature requests, billing.

## Facts

- Product name: SciolyPrep (operated by Pathvana LLC)
- Site: ${base}
- Support email: support@aitrove.ai
- Questions per test: 5-50, multiple choice with 4 options, AI-graded with partial credit
- Difficulty levels: Invitational (easiest), Regional, State, National (hardest)
- Free tier: 5 AI test generations per month, no credit card required
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

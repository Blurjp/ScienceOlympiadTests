import { getAllTestSummaries, getAvailableTopics } from '@/lib/database';
import HomePage from '@/components/home/home-page';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Self-referencing canonical so query-string variants (e.g. /?inspired=true
// from the PDF parser hand-off) consolidate onto the clean homepage URL.
export const metadata: Metadata = {
  alternates: { canonical: getSiteUrl() },
};

// How many test cards to embed in the server-rendered HTML. The full library
// re-hydrates client-side on mount (the grid refetches /api/tests?summary=1),
// so this only bounds the crawler-visible payload: an unbounded list put
// 100+ card titles in the document and diluted the page's topical focus.
const SSR_TEST_CARD_LIMIT = 12;

export default async function Page() {
  // Fetch publisher content server-side so crawlers see real content
  // (AdSense: no ads on screens without publisher-content / low value
  // content). Summaries only - full questions would bloat the HTML payload;
  // they load per-test on demand when a test is started.
  //
  // The SSR payload is deliberately the ANONYMOUS view (public tests only):
  // the response must never vary by viewer or a cached copy could leak one
  // user's private imports to the next visitor. Signed-in users get their
  // own private tests via the client-side /api/tests fetch on mount.
  let tests: Awaited<ReturnType<typeof getAllTestSummaries>> = [];
  let topics: string[] = [];
  try {
    [tests, topics] = await Promise.all([
      getAllTestSummaries(),
      getAvailableTopics(),
    ]);
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }
  const initialTests = tests.slice(0, SSR_TEST_CARD_LIMIT);

  const base = getSiteUrl();

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SciolyPrep',
    legalName: 'Pathvana LLC',
    url: base,
    logo: `${base}/favicon.svg`,
    email: 'support@aitrove.ai',
    description:
      'Maker of SciolyPrep, an AI-powered Science Olympiad practice test generator with PDF import and progress tracking.',
  };

  const homeFaq = [
    {
      q: 'Is SciolyPrep free?',
      a: 'Yes. You get 5 free AI test generations every month, forever, with no credit card required. Paid plans unlock unlimited generations for competitors who need more volume during the season.',
    },
    {
      q: 'How does the AI Science Olympiad test generator work?',
      a: 'Pick an event, a difficulty (Invitational, Regional, State, or National), and the number of questions. SciolyPrep generates multiple-choice questions and answers at that difficulty. AI-generated material can contain mistakes, so check answers against reliable sources.',
    },
    {
      q: 'Can I practice with real past Science Olympiad exams?',
      a: 'Yes. Upload a past exam PDF from your computer or a Google Drive link and every question is parsed into an interactive, timed test. The Exam-Inspired Generator also analyzes real exam structures and writes 100% original new questions in the same style.',
    },
    {
      q: 'Which Science Olympiad events are covered?',
      a: `All ${DEFAULT_TOPICS.length} major Science Olympiad events across Divisions B and C, including Anatomy and Physiology, Astronomy, Botany, Chemistry Lab, Disease Detectives, Food Science, Forensics, and Thermodynamics. Each event has its own study guide and practice tests at four difficulty levels.`,
    },
    {
      q: 'Is SciolyPrep affiliated with Science Olympiad, Inc.?',
      a: 'No. SciolyPrep is an independent practice platform operated by Pathvana LLC and is not affiliated with, endorsed by, or sponsored by Science Olympiad, Inc.',
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Science Olympiad Tests',
    alternateName: 'SciolyPrep',
    url: base,
    description:
      'AI-powered Science Olympiad practice test generator with PDF import and progress tracking.',
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Science Olympiad Tests',
    url: base,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description:
      'Generate and practice Science Olympiad tests for Division B and Division C events with AI. Original questions at Invitational through National difficulty, past-exam PDF import, and progress tracking.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier: 5 AI test generations per month',
    },
    featureList: [
      'AI test generation for 20 Science Olympiad events',
      'Past exam PDF import',
      'Exam-inspired original test generation',
      'AI answer grading with partial credit',
      'Progress and score tracking',
    ],
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={appJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={faqJsonLd} />
      <HomePage
        initialTests={initialTests}
        initialTopics={topics.length > 0 ? topics : DEFAULT_TOPICS}
      />

      {/* Visible FAQ mirrors the FAQPage structured data above. */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="mt-4 space-y-4">
            {homeFaq.map((item) => (
              <div key={item.q} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

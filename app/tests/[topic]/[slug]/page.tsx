import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';
import { slugifyTopic, unslugifyTopic } from '@/lib/event-pages';
import { isCuratedTestId } from '@/lib/curated-tests';
import {
  getPublicOriginalTest,
  getPublicTestSummariesByTopic,
} from '@/lib/database';
import {
  buildTestPath,
  buildTestSlug,
  difficultyLabel,
  difficultySlug,
  formatTotalTime,
  isPageEligibleTest,
  parseTestSlug,
  toPublicQuestions,
} from '@/lib/test-pages';

// Per-test pages are public, immutable-ish content: ISR with an hourly
// revalidate. If a test is ever flipped private, its cached page disappears
// within the window (and the page never contains answers, so a stale copy
// only exposes questions that were already public).
export const revalidate = 3600;

interface TestPageProps {
  params: { topic: string; slug: string };
}

function difficultyCopy(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return 'invitational level';
    case 'Hard':
      return 'national level';
    default:
      return 'regional and state level';
  }
}

export async function generateMetadata({
  params,
}: TestPageProps): Promise<Metadata> {
  const parsed = parseTestSlug(params.slug);
  if (!parsed) return {};
  const loaded = await getPublicOriginalTest(parsed.id);
  if (!loaded) return {};
  const { test } = loaded;

  const title = `${test.topic} Practice Test (${test.difficulty}) — ${test.questions.length} Questions`;
  const description = `Free ${test.topic} practice test for Science Olympiad at ${difficultyCopy(test.difficulty)}. ${test.questions.length} multiple-choice questions with a ${formatTotalTime(test.totalTime)} timer. Start online or review every question first.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${getSiteUrl()}${buildTestPath(params.topic, test.id, test.difficulty)}`,
    },
    // Only curated tests may be indexed; everything else is noindex,follow
    // so link equity still flows without tripping scaled-content spam.
    robots: isCuratedTestId(test.id)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function TestPage({ params }: TestPageProps) {
  const parsed = parseTestSlug(params.slug);
  if (!parsed) notFound();

  const loaded = await getPublicOriginalTest(parsed.id);
  // Missing, private, imported, or generate-from-pdf output: same 404 as
  // any absent page (never confirm the id exists).
  if (!loaded) notFound();
  const { test } = loaded;

  // Belt and braces: the SQL enforces eligibility, the shared predicate
  // double-checks it so the two rules can never drift apart silently.
  if (!isPageEligibleTest(test)) notFound();

  // The id is the stable part of the URL; topic/difficulty slugs must match
  // the record or we 301 to the canonical URL.
  const canonicalTopic = slugifyTopic(test.topic);
  const canonicalSlug = buildTestSlug(test.id, test.difficulty);
  if (params.topic !== canonicalTopic || params.slug !== canonicalSlug) {
    permanentRedirect(buildTestPath(canonicalTopic, test.id, test.difficulty));
  }

  const questions = toPublicQuestions(test.questions);
  const curated = isCuratedTestId(test.id);
  const base = getSiteUrl();
  const canonicalPath = buildTestPath(canonicalTopic, test.id, test.difficulty);
  const eventSlug = unslugifyTopic(canonicalTopic);

  // Sibling difficulties: other page-eligible public tests for this event.
  const topicSummaries = (await getPublicTestSummariesByTopic(test.topic))
    .filter((s) => isPageEligibleTest(s) && s.id !== test.id && s.difficulty !== test.difficulty);
  const siblingByDifficulty = new Map<string, typeof topicSummaries[number]>();
  for (const s of topicSummaries) {
    if (!siblingByDifficulty.has(s.difficulty)) siblingByDifficulty.set(s.difficulty, s);
  }
  const siblings = Array.from(siblingByDifficulty.values());

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Events', item: `${base}/events` },
      ...(eventSlug
        ? [{ '@type': 'ListItem', position: 3, name: test.topic, item: `${base}/events/${canonicalTopic}` }]
        : []),
      {
        '@type': 'ListItem',
        position: eventSlug ? 4 : 3,
        name: `${test.topic} ${test.difficulty} Practice Test`,
        item: `${base}${canonicalPath}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="text-blue-700 underline hover:text-blue-900">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/events" className="text-blue-700 underline hover:text-blue-900">Events</Link></li>
            {eventSlug ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/events/${canonicalTopic}`} className="text-blue-700 underline hover:text-blue-900">
                    {test.topic}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-900 font-medium">
              {test.difficulty} practice test
            </li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {test.topic} Practice Test — {test.difficulty} Level
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed">
            A free {test.questions.length}-question {test.topic} practice test for
            Science Olympiad, written at {difficultyCopy(test.difficulty)}. Every
            question and answer choice is listed below — correct answers and
            scoring are revealed when you take the timed test.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-800">{test.questions.length} questions</span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-800">{formatTotalTime(test.totalTime)} timed</span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-800">{test.difficulty} level</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">AI-generated — verify answers against reliable sources</span>
          </div>
          <div className="mt-5">
            <Link
              href={`/?test=${test.id}`}
              className="inline-flex items-center rounded-full bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
            >
              Start test — reveal answers &amp; scoring
            </Link>
          </div>
        </header>

        {siblings.length > 0 ? (
          <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Other difficulties for {test.topic}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    href={buildTestPath(slugifyTopic(s.topic), s.id, s.difficulty)}
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm text-blue-700 underline hover:bg-slate-100"
                  >
                    {s.difficulty} ({s.questionCount} questions)
                  </Link>
                </li>
              ))}
            </ul>
            {eventSlug ? (
              <p className="mt-3 text-sm text-slate-600">
                Studying this event? See the{' '}
                <Link href={`/events/${canonicalTopic}`} className="text-blue-700 underline hover:text-blue-900">
                  {test.topic} study guide and all practice tests
                </Link>
                .
              </p>
            ) : null}
          </section>
        ) : null}

        <section aria-label="Practice questions" className="space-y-6">
          {questions.map((q) => (
            <article key={q.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="font-medium text-slate-900">
                {q.number}. {q.question}
              </h3>
              {q.options.length > 0 ? (
                <ul className="mt-3 space-y-1.5 text-slate-700">
                  {q.options.map((option, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-medium text-slate-500">{String.fromCharCode(65 + i)}.</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>

        <footer className="mt-10 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p>
            Questions are AI-generated for {test.topic} practice and can contain
            mistakes — check answers against reliable sources. Take the timed
            version to see correct answers, scoring, and explanations:{' '}
            <Link href={`/?test=${test.id}`} className="text-blue-700 underline hover:text-blue-900">
              start the {test.topic} test
            </Link>
            .
          </p>
        </footer>

        <JsonLd data={breadcrumbJsonLd} />
      </div>
    </div>
  );
}

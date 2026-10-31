import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { slugifyTopic } from '@/lib/event-pages';
import { SEASON_2027_DIVISIONS, type Division } from '@/lib/divisions';

export const metadata: Metadata = {
  title: 'Science Olympiad Event Practice Tests & Study Guides',
  description:
    'Free AI practice tests and study guides for every Science Olympiad Division B and C event, from Anatomy to Wind Power.',
  alternates: { canonical: `${getSiteUrl()}/events` },
  openGraph: {
    url: `${getSiteUrl()}/events`,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Science Olympiad event practice tests on SciolyPrep',
      },
    ],
  },
};

const GROUPS: { key: Division | 'past'; heading: string; blurb: string }[] = [
  {
    key: 'BC',
    heading: 'Offered in Both Division B and Division C (2027)',
    blurb: 'These events run in both the middle-school and high-school divisions this season.',
  },
  {
    key: 'B',
    heading: 'Division B Only (2027)',
    blurb: 'Middle-school division events for the 2026–27 season.',
  },
  {
    key: 'C',
    heading: 'Division C Only (2027)',
    blurb: 'High-school division events for the 2026–27 season.',
  },
  {
    key: 'past',
    heading: 'Past-Season Events (Still Great Practice)',
    blurb: 'Not on the 2027 slate, but these events ran in recent seasons and return often — their study guides and tests stay open.',
  },
];

export default function EventsIndexPage() {
  const base = getSiteUrl();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Science Olympiad Event Practice Tests',
    itemListElement: DEFAULT_TOPICS.map((topic, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${topic} Practice Tests`,
      url: `${base}/events/${slugifyTopic(topic)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={itemListJsonLd} />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900">Science Olympiad Event Practice Tests</h1>
        <p className="mt-4 text-lg text-gray-600">
          Free study guides and AI-generated practice tests for every test-based Science
          Olympiad event, grouped below by division for the 2026–27 (2027) season. Each
          event page has a topic guide, a sample question you can try without signing in,
          and unlimited practice tests at Invitational through National difficulty. You
          can also <Link href="/events/2027" className="text-blue-700 underline hover:text-blue-900">see the full official 2027 events list</Link> for
          both divisions, including build events.
        </p>

        <div className="mt-10 space-y-10">
          {GROUPS.map((group) => {
            const topics = DEFAULT_TOPICS.filter(
              (t) => (SEASON_2027_DIVISIONS[t] ?? 'past') === group.key
            );
            if (topics.length === 0) return null;
            return (
              <section key={group.key} aria-labelledby={`group-${group.key}`}>
                <h2 id={`group-${group.key}`} className="text-2xl font-bold text-gray-900">
                  {group.heading}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{group.blurb}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {topics.map((topic) => (
                    <Link
                      key={topic}
                      href={`/events/${slugifyTopic(topic)}`}
                      className="rounded-lg border bg-white p-4 hover:border-blue-400 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900">{topic}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Practice tests &amp; study guide · Invitational to National difficulty
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

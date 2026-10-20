import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { slugifyTopic } from '@/lib/event-pages';

export const metadata: Metadata = {
  title: 'Science Olympiad Event Practice Tests & Study Guides',
  description:
    'Free AI-generated practice tests for every major Science Olympiad event in Divisions B and C - Anatomy, Astronomy, Botany, Chemistry Lab, Forensics, Thermodynamics, and more. Difficulty from Invitational to National.',
  alternates: { canonical: `${getSiteUrl()}/events` },
  openGraph: {
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
          Free, AI-generated practice tests for all {DEFAULT_TOPICS.length} major Science
          Olympiad events across Divisions B and C. Each event page includes a study guide covering what the
          test expects, plus practice tests at Invitational, Regional, State, and National
          difficulty.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {DEFAULT_TOPICS.map((topic) => (
            <Link
              key={topic}
              href={`/events/${slugifyTopic(topic)}`}
              className="rounded-lg border bg-white p-4 hover:border-blue-400 transition-colors"
            >
              <h2 className="font-semibold text-gray-900">{topic}</h2>
              <p className="mt-1 text-sm text-gray-600">
                Practice tests &amp; study guide · Invitational to National difficulty
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

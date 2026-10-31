import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { slugifyTopic } from '@/lib/event-pages';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import {
  DIVISION_B_2027,
  DIVISION_C_2027,
  SEASON_2027_THEMES,
} from '@/lib/divisions';

export const revalidate = 86400; // rosters are stable; daily recheck is plenty

export const metadata: Metadata = {
  title: '2027 Science Olympiad Events List — Divisions B & C',
  description:
    'The complete official 2027 Science Olympiad events list for Division B and Division C, with season topics and links to free practice tests for every test-based event.',
  alternates: { canonical: `${getSiteUrl()}/events/2027` },
  openGraph: {
    url: `${getSiteUrl()}/events/2027`,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '2027 Science Olympiad events list on SciolyPrep',
      },
    ],
  },
};

function Roster({ roster }: { roster: { category: string; events: string[] }[] }) {
  return (
    <div className="mt-4 space-y-6">
      {roster.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {group.category}
          </h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {group.events.map((event) => {
              // Only events this site covers link out (DEFAULT_TOPICS);
              // build events list plainly so the roster stays complete.
              const covered = DEFAULT_TOPICS.includes(event);
              const theme = SEASON_2027_THEMES[event];
              return (
                <li key={event} className="rounded-lg border bg-white px-4 py-2 text-gray-800">
                  {covered ? (
                    <Link
                      href={`/events/${slugifyTopic(event)}`}
                      className="text-blue-700 underline hover:text-blue-900"
                    >
                      {event}
                    </Link>
                  ) : (
                    <span>{event}</span>
                  )}
                  {theme ? <span className="ml-2 text-sm text-gray-500">({theme})</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function Events2027Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/events" className="hover:text-blue-600">Events</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">2027 Season</span>
        </nav>

        <h1 className="text-4xl font-bold text-gray-900">2027 Science Olympiad Events List</h1>
        <p className="mt-4 text-lg text-gray-600">
          Every event on the official 2027 slate for the 2026–27 season — 23 events in
          Division B (middle school) and 23 in Division C (high school). Events with a
          noted theme follow this season&apos;s rules-manual topic. Linked events have a
          free study guide and AI practice tests at Invitational through National
          difficulty; build and trial events are listed for completeness.
        </p>

        <section className="mt-10" aria-labelledby="div-b-heading">
          <h2 id="div-b-heading" className="text-2xl font-bold text-gray-900">
            Division B Events (2027)
          </h2>
          <Roster roster={DIVISION_B_2027} />
        </section>

        <section className="mt-10" aria-labelledby="div-c-heading">
          <h2 id="div-c-heading" className="text-2xl font-bold text-gray-900">
            Division C Events (2027)
          </h2>
          <Roster roster={DIVISION_C_2027} />
        </section>

        <section className="mt-10 rounded-lg border border-blue-200 bg-white p-5 text-sm text-gray-600">
          <h2 className="text-base font-semibold text-gray-900">Notes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Code Craze is a featured trial event for 2027.</li>
            <li>
              Roster per the official Science Olympiad yearly event slate (soinc.org);
              always confirm against the current rules manual and your state&apos;s site.
            </li>
            <li>
              SciolyPrep is an independent practice platform and is not affiliated with,
              endorsed by, or sponsored by Science Olympiad, Inc.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

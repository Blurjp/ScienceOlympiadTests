import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { slugifyTopic } from '@/lib/event-pages';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { getIndexableTestSummaries } from '@/lib/database';
import { buildTestPath } from '@/lib/test-pages';

// The indexable set changes via the admin toggle without deploys, so the
// sitemap regenerates hourly instead of being frozen at build time.
export const revalidate = 3600;

// Bump these dates when the corresponding content actually changes, so
// crawlers can trust the lastModified signal instead of seeing every URL
// as "modified today" on each deploy.
const GUIDES_UPDATED = new Date('2026-10-16'); // event guides + about/contact
const PRICING_UPDATED = new Date('2026-10-16'); // pricing page
const LEGAL_UPDATED = new Date('2026-10-16'); // privacy/terms
const IMPORT_LANDING_UPDATED = new Date('2026-10-31');

// Per-test pages: only tests with the admin-set `indexable` flag (one per
// event x difficulty, >=10 questions, human-checked) are indexed, so the
// sitemap lists exactly those, with real per-test lastmod dates. Every
// other test page is noindex,follow and intentionally absent here.
async function indexedTestEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const summaries = await getIndexableTestSummaries();
    return summaries.map((s) => ({
      url: `${getSiteUrl()}${buildTestPath(slugifyTopic(s.topic), s.id, s.difficulty)}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Failed to load indexable tests for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  // Home page content (test library) changes continuously.
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/events`, lastModified: GUIDES_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    ...DEFAULT_TOPICS.map((topic) => ({
      url: `${base}/events/${slugifyTopic(topic)}`,
      lastModified: GUIDES_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${base}/import`, lastModified: IMPORT_LANDING_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: GUIDES_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: GUIDES_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/pricing`, lastModified: PRICING_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    // /login is intentionally omitted: it's noindexed and has no search value.
    { url: `${base}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    ...(await indexedTestEntries()),
  ];
}

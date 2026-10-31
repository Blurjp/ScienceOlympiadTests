import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { slugifyTopic } from '@/lib/event-pages';
import { DEFAULT_TOPICS } from '@/lib/default-topics';

// Bump these dates when the corresponding content actually changes, so
// crawlers can trust the lastModified signal instead of seeing every URL
// as "modified today" on each deploy.
const GUIDES_UPDATED = new Date('2026-10-16'); // event guides + about/contact
const PRICING_UPDATED = new Date('2026-10-16'); // pricing page
const LEGAL_UPDATED = new Date('2026-10-16'); // privacy/terms

export default function sitemap(): MetadataRoute.Sitemap {
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
    { url: `${base}/about`, lastModified: GUIDES_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: GUIDES_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/pricing`, lastModified: PRICING_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    // /login is intentionally omitted: it's noindexed and has no search value.
    { url: `${base}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

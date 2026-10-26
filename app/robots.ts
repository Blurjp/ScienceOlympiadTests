import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Only block pages that must never appear in search results.
      // /profile and /history are intentionally NOT disallowed: they carry
      // robots noindex meta tags, and a URL blocked in robots.txt can never
      // be crawled, so Google would never see the noindex (leaving
      // externally-linked copies as "Indexed, though blocked by robots.txt").
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

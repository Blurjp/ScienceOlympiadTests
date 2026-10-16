import { getAllTests, getAvailableTopics } from '@/lib/database';
import HomePage from '@/components/home/home-page';
import { DEFAULT_TOPICS } from '@/lib/default-topics';
import { JsonLd } from '@/components/seo/json-ld';
import { getSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function Page() {
  // Fetch real content server-side so crawlers see publisher content
  // (AdSense: no ads on screens without publisher-content / low value content)
  let tests: Awaited<ReturnType<typeof getAllTests>> = [];
  let topics: string[] = [];
  try {
    [tests, topics] = await Promise.all([getAllTests(), getAvailableTopics()]);
  } catch (error) {
    console.error('Failed to load initial data:', error);
  }

  const base = getSiteUrl();

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
      'Generate and practice Science Olympiad Division C tests with AI. Original questions at Invitational through National difficulty, past-exam PDF import, and progress tracking.',
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
      <HomePage
        initialTests={tests}
        initialTopics={topics.length > 0 ? topics : DEFAULT_TOPICS}
      />
    </>
  );
}

import { getAllTests, getAvailableTopics } from '@/lib/database';
import HomePage from '@/components/home/home-page';
import { DEFAULT_TOPICS } from '@/lib/default-topics';

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

  return (
    <HomePage
      initialTests={tests}
      initialTopics={topics.length > 0 ? topics : DEFAULT_TOPICS}
    />
  );
}

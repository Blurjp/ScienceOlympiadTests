// IndexNow: notify participating engines (Bing, Yandex, Seznam, Naver —
// feeding Copilot, DuckDuckGo results, ChatGPT search) of new/changed URLs
// immediately instead of waiting for organic recrawl.
//
// The key file public/63187238e0f516bc5b0060b62a95f584.txt must stay
// servable at https://sciolyprep.com/63187238e0f516bc5b0060b62a95f584.txt
// (IndexNow verifies ownership by fetching it).
const INDEXNOW_KEY = '63187238e0f516bc5b0060b62a95f584';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function getIndexNowKey(): string {
  return INDEXNOW_KEY;
}

/**
 * Fire-and-forget ping. Never throws - a failed ping only means slower
 * re-crawl, so callers use `void pingIndexNow(...)` and move on.
 * API limit is 10,000 URLs per request.
 */
export async function pingIndexNow(
  urls: string[],
  host: string
): Promise<void> {
  if (urls.length === 0) return;
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });
    // 200 = queued, 202 = accepted, 422 = key not yet verified (retries
    // happen naturally on the next toggle). Anything else just gets logged.
    if (response.status !== 200 && response.status !== 202) {
      console.error(
        `IndexNow ping failed (${response.status}) for ${urls.length} url(s):`,
        await response.text().catch(() => '')
      );
    }
  } catch (error) {
    console.error('IndexNow ping error:', error);
  }
}

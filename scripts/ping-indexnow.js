// Ping IndexNow for every indexed per-test page. Reads URLs straight from
// the live sitemap, so it always matches exactly what search engines see.
//
// Usage: node scripts/ping-indexnow.js [--dry-run]
//   SITE_URL overrides the target (default https://sciolyprep.com)

// Keep in sync with lib/indexnow.ts (plain node can't import TypeScript).
const fs = require('fs');
const path = require('path');
const keyMatch = fs
  .readFileSync(path.join(__dirname, '../lib/indexnow.ts'), 'utf8')
  .match(/INDEXNOW_KEY = '([0-9a-f]+)'/);
const KEY = keyMatch ? keyMatch[1] : null;
if (!KEY) {
  console.error('Could not read IndexNow key from lib/indexnow.ts');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const site = process.env.SITE_URL || 'https://sciolyprep.com';
const host = new URL(site).host;

(async () => {
  const xml = await (await fetch(`${site}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]*\/tests\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) {
    console.error('No /tests/ URLs found in the sitemap (ISR may not have refreshed yet).');
    process.exit(1);
  }
  console.log(`Pinging IndexNow for ${urls.length} test page(s) on ${host}${dryRun ? ' [dry run]' : ''}`);
  if (dryRun) {
    urls.forEach((u) => console.log(' ', u));
    return;
  }
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `${site}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`IndexNow response: ${response.status} ${response.statusText}`);
  console.log(
    response.status === 200 || response.status === 202
      ? 'Accepted (200=queued, 202=key pending verification - first ping only).'
      : await response.text()
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

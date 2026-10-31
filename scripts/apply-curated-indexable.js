// One-off: seed the tests.indexable flag from the reviewed curated list in
// lib/curated-tests.ts (one test per event x difficulty, >=10 questions,
// human spot-checked 2026-10-31).
//
// After this runs, runtime (page robots meta, sitemap, event-page links)
// reads ONLY the DB flag; this list is the initial seed, not the source of
// truth. Ongoing changes go through the admin toggle (Admin > SEO Tests).
//
// Usage: node scripts/apply-curated-indexable.js [--local]
const { createClient } = require('@libsql/client');
const fs = require('fs');

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {}
}
loadEnvLocal();

const isLocal = process.argv.includes('--local');
const url = isLocal ? 'file:scioly.db' : process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error('No database URL (set TURSO_DATABASE_URL or pass --local)');
  process.exit(1);
}
const client = createClient({
  url,
  authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN,
});

// Keep in sync with CURATED_TEST_IDS in lib/curated-tests.ts — extracted
// from source (plain node can't require TypeScript). Regenerate candidates
// with `node scripts/suggest-curated-tests.js`.
const curatedSrc = fs.readFileSync(
  require('path').join(__dirname, '../lib/curated-tests.ts'),
  'utf8'
);
const CURATED_TEST_IDS = [...curatedSrc.matchAll(/'([0-9a-z-]+)'/g)].map((m) => m[1]);
if (CURATED_TEST_IDS.length === 0) {
  console.error('No ids extracted from lib/curated-tests.ts');
  process.exit(1);
}

(async () => {
  // Same eligibility + quality bar the admin endpoint enforces.
  const result = await client.execute({
    sql: `UPDATE tests
          SET indexable = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${CURATED_TEST_IDS.map(() => '?').join(',')})
            AND is_public = 1
            AND source_url IS NULL
            AND title NOT LIKE 'Original Practice:%'
            AND COALESCE(description, '') NOT LIKE 'Imported from%'
            AND COALESCE(description, '') NOT LIKE 'Parsed from%'
            AND (SELECT COUNT(*) FROM questions WHERE test_id = tests.id) >= 10`,
    args: [...CURATED_TEST_IDS],
  });
  console.log(`Marked ${result.rowsAffected} tests indexable (of ${CURATED_TEST_IDS.length} curated ids).`);

  if (result.rowsAffected !== CURATED_TEST_IDS.length) {
    // Report which curated ids did not apply and why.
    const applied = await client.execute({
      sql: `SELECT id FROM tests WHERE indexable = 1`,
    });
    const appliedIds = new Set(applied.rows.map((r) => r.id));
    const missing = CURATED_TEST_IDS.filter((id) => !appliedIds.has(id));
    if (missing.length > 0) {
      console.warn('Not applied (ineligible, private, or <10 questions):');
      for (const id of missing) console.warn(`  ${id}`);
    }
  }

  const total = await client.execute(
    `SELECT COUNT(*) AS n FROM tests WHERE indexable = 1`
  );
  console.log(`Total indexable tests now: ${total.rows[0].n}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

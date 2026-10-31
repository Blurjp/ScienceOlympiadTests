// Suggest one curated (indexable) test per event x difficulty: the public
// AI-generated test with the most questions (>= 10). Output is pasted into
// lib/curated-tests.ts after a human checks the content.
//
// Usage: node scripts/suggest-curated-tests.js [--local]
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

(async () => {
  const result = await client.execute(`
    SELECT t.topic, t.difficulty, t.id, t.title,
           (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count
    FROM tests t
    WHERE t.is_public = 1
      AND t.title NOT LIKE 'Original Practice:%'
      AND COALESCE(t.description,'') NOT LIKE 'Imported from%'
      AND COALESCE(t.description,'') NOT LIKE 'Parsed from%'
      AND t.source_url IS NULL
    ORDER BY t.topic, t.difficulty, question_count DESC, t.updated_at DESC`);

  const best = new Map();
  for (const row of result.rows) {
    const key = `${row.topic}|${row.difficulty}`;
    const existing = best.get(key);
    if (!existing || Number(row.question_count) > Number(existing.question_count)) {
      best.set(key, row);
    }
  }

  const eligible = [...best.values()].filter((r) => Number(r.question_count) >= 10);
  const rejected = [...best.values()].filter((r) => Number(r.question_count) < 10);

  console.log('// topic | difficulty | questions | id | title');
  for (const r of eligible.sort((a, b) => `${a.topic}${a.difficulty}`.localeCompare(`${b.topic}${b.difficulty}`))) {
    console.log(`// ${r.topic} | ${r.difficulty} | ${r.question_count} | ${r.id} | ${r.title}`);
  }
  console.log(`\n// ${eligible.length} eligible; ${rejected.length} rejected (<10 questions):`);
  for (const r of rejected) {
    console.log(`//   ${r.topic} | ${r.difficulty} | ${r.question_count} | ${r.id}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });

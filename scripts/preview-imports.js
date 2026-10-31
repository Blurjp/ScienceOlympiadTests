// One-off: run the make-imports-private.sql PREVIEW queries against the
// configured database (Turso in prod via env, or local file). READ-ONLY.
// Usage: node scripts/preview-imports.js [--local]
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

const url = process.argv.includes('--local')
  ? 'file:scioly.db'
  : process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error('No database URL (set TURSO_DATABASE_URL or pass --local)');
  process.exit(1);
}
const client = createClient({
  url,
  authToken: process.argv.includes('--local') ? undefined : process.env.TURSO_AUTH_TOKEN,
});

async function run(label, sql) {
  const r = await client.execute(sql);
  console.log(`\n=== ${label} ===`);
  if (r.rows.length === 0) { console.log('(no rows)'); return; }
  const cols = Object.keys(r.rows[0]);
  console.log(cols.join(' | '));
  for (const row of r.rows.slice(0, 40)) {
    console.log(cols.map((c) => String(row[c] ?? '').slice(0, 60)).join(' | '));
  }
  if (r.rows.length > 40) console.log(`... ${r.rows.length - 40} more rows`);
}

(async () => {
  console.log('DB:', process.argv.includes('--local') ? 'file:scioly.db' : url);

  await run('Public/private split (before migration)', 'SELECT is_public, COUNT(*) AS tests FROM tests GROUP BY is_public');

  await run(`PREVIEW 1: rows the UPDATE would flip`, `
    SELECT
      COUNT(*) AS total_to_privatize,
      SUM(CASE WHEN source_url IS NOT NULL THEN 1 ELSE 0 END) AS url_imports,
      SUM(CASE WHEN source_url IS NULL AND description LIKE 'Imported from%' THEN 1 ELSE 0 END) AS url_imports_missing_source,
      SUM(CASE WHEN source_url IS NULL AND description LIKE 'Parsed from%' THEN 1 ELSE 0 END) AS uploaded_pdf_imports
    FROM tests
    WHERE is_public = 1
      AND (source_url IS NOT NULL OR description LIKE 'Imported from%' OR description LIKE 'Parsed from%')`);

  await run('PREVIEW 1b: sanity — how many public rows total (migration should be a small subset)', `
    SELECT COUNT(*) AS public_total FROM tests WHERE is_public = 1`);

  await run('REVIEW-ONLY: import-looking public rows that missed every marker (expect none)', `
    SELECT id, title, description, source_url
    FROM tests
    WHERE is_public = 1
      AND source_url IS NULL
      AND description NOT LIKE 'Imported from%'
      AND description NOT LIKE 'Parsed from%'
      AND (title LIKE 'Test from %' OR title LIKE 'Copy Of%' OR title LIKE 'Copy of%')`);

  await run('Sanity: source_url IS NULL public rows whose title looks like an import', `
    SELECT id, title, LEFT(COALESCE(description,''), 50) AS description
    FROM tests
    WHERE is_public = 1 AND source_url IS NULL
      AND (title LIKE '%PDF%' OR title LIKE '%pdf%' OR title LIKE '%Invitational%' OR title LIKE '%Regional%' OR title LIKE '%Tryout%')
    LIMIT 25`);
})().catch((e) => { console.error(e); process.exit(1); });

// One-off: apply scripts/make-imports-private.sql against the configured
// database (Turso via env, or local file), then verify. Usage:
//   node scripts/apply-imports-private.js [--local]
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
  console.log('DB:', url);

  const before = await client.execute('SELECT COUNT(*) AS n FROM tests WHERE is_public = 1 AND (source_url IS NOT NULL OR description LIKE \'Imported from%\' OR description LIKE \'Parsed from%\')');
  console.log('public imports before:', before.rows[0].n);
  if (Number(before.rows[0].n) === 0) {
    console.log('Nothing to do.');
    return;
  }

  const upd = await client.execute(`
    UPDATE tests
    SET is_public = 0, updated_at = CURRENT_TIMESTAMP
    WHERE is_public = 1
      AND (source_url IS NOT NULL
           OR description LIKE 'Imported from%'
           OR description LIKE 'Parsed from%')`);
  console.log('rows updated:', upd.rowsAffected);

  const still = await client.execute(`SELECT COUNT(*) AS still_public_imports FROM tests WHERE is_public = 1 AND (source_url IS NOT NULL OR description LIKE 'Imported from%' OR description LIKE 'Parsed from%')`);
  console.log('VERIFY still_public_imports (expect 0):', still.rows[0].n);

  const split = await client.execute('SELECT is_public, COUNT(*) AS tests FROM tests GROUP BY is_public');
  for (const row of split.rows) console.log('is_public =', row.is_public, '→', row.tests, 'tests');
})().catch((e) => { console.error(e); process.exit(1); });

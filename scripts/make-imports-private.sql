-- One-off migration: mark third-party imported tests private.
--
-- Background: until now every saved test rode the `is_public BOOLEAN DEFAULT 1`
-- column default, so imported school/invitational exams were published on the
-- public homepage. saveTest() now writes is_public explicitly (imports and
-- exam-inspired output default to private), but rows imported BEFORE that
-- change need this UPDATE.
--
-- Import markers:
--   1. URL imports (app/api/download-pdf): source_url IS NOT NULL, or
--      description LIKE 'Imported from%' (set at import time)
--   2. Uploaded-PDF parses (app/pdf-parser): description LIKE 'Parsed from%'
-- The LIKE prefixes are deliberate: exact-equality on one string breaks if
-- the wording ever changes; the prefixes catch both historic variants.
--
-- Run the PREVIEW queries first and sanity-check the counts (expected order
-- of magnitude: roughly a hundred rows, matching the imported exams visible
-- on the homepage today - NOT the full table, and NOT the AI-generated
-- tests). Then run the UPDATE and the VERIFY queries.

-- ============ 1. PREVIEW (run these first) ============

-- How many rows will flip, broken down by which marker matched
SELECT
  COUNT(*) AS total_to_privatize,
  SUM(CASE WHEN source_url IS NOT NULL THEN 1 ELSE 0 END) AS url_imports,
  SUM(CASE WHEN source_url IS NULL AND description LIKE 'Imported from%' THEN 1 ELSE 0 END) AS url_imports_missing_source,
  SUM(CASE WHEN source_url IS NULL AND description LIKE 'Parsed from%' THEN 1 ELSE 0 END) AS uploaded_pdf_imports
FROM tests
WHERE is_public = 1
  AND (source_url IS NOT NULL
       OR description LIKE 'Imported from%'
       OR description LIKE 'Parsed from%');

-- The actual rows (eyeball the titles)
SELECT id, title, user_id, source_url, description
FROM tests
WHERE is_public = 1
  AND (source_url IS NOT NULL
       OR description LIKE 'Imported from%'
       OR description LIKE 'Parsed from%');

-- REVIEW ONLY - do not auto-UPDATE from this query. Import-looking public
-- rows that missed every marker above (e.g. edited descriptions). Expected:
-- empty. If not, decide row by row - AI-generated tests can legitimately
-- mention invitational/tryout words in a title.
SELECT id, title, description, source_url
FROM tests
WHERE is_public = 1
  AND source_url IS NULL
  AND description NOT LIKE 'Imported from%'
  AND description NOT LIKE 'Parsed from%'
  AND (title LIKE 'Test from %' OR title LIKE 'Copy Of%' OR title LIKE 'Copy of%');

-- ============ 2. APPLY ============

UPDATE tests
SET is_public = 0, updated_at = CURRENT_TIMESTAMP
WHERE is_public = 1
  AND (source_url IS NOT NULL
       OR description LIKE 'Imported from%'
       OR description LIKE 'Parsed from%');

-- ============ 3. VERIFY ============

-- No third-party imports remain public (expect 0)
SELECT COUNT(*) AS still_public_imports
FROM tests
WHERE is_public = 1
  AND (source_url IS NOT NULL
       OR description LIKE 'Imported from%'
       OR description LIKE 'Parsed from%');

-- Public/ private split after the migration (public should be roughly the
-- AI-generated set only)
SELECT is_public, COUNT(*) AS tests
FROM tests
GROUP BY is_public;

-- One-off migration: mark third-party imported tests private.
--
-- Background: until now every saved test rode the `is_public BOOLEAN DEFAULT 1`
-- column default, so imported school/invitational exams were published on the
-- public homepage. saveTest() now writes is_public explicitly (imports default
-- to private), but rows imported BEFORE that change need this UPDATE.
--
-- Covers both import paths:
--   1. URL imports (app/api/download-pdf): source_url is set
--   2. Uploaded-PDF parses (app/pdf-parser): description is 'Parsed from uploaded PDF'
-- AI-generated / exam-inspired tests have no source_url and different
-- descriptions, so they stay public.
--
-- Run against the production database (e.g. via turso CLI or sqlite3):

-- 1. Preview what will change (expect: imported exams only)
SELECT id, title, user_id, source_url
FROM tests
WHERE is_public = 1
  AND (source_url IS NOT NULL OR description = 'Parsed from uploaded PDF');

-- 2. Apply
UPDATE tests
SET is_public = 0, updated_at = CURRENT_TIMESTAMP
WHERE is_public = 1
  AND (source_url IS NOT NULL OR description = 'Parsed from uploaded PDF');

-- 3. Verify: no third-party imports remain public
SELECT COUNT(*) AS still_public_imports
FROM tests
WHERE is_public = 1
  AND (source_url IS NOT NULL OR description = 'Parsed from uploaded PDF');

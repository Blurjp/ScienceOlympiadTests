/**
 * Tests for lib/pdf-sources.ts
 * Note: PDF sources are now dynamically fetched from the database.
 * This test file covers the remaining static export.
 */
import { TEST_EXCHANGE_ARCHIVE_URL } from '@/lib/pdf-sources';

describe('pdf-sources', () => {
  describe('TEST_EXCHANGE_ARCHIVE_URL', () => {
    test('is defined and is a valid URL', () => {
      expect(TEST_EXCHANGE_ARCHIVE_URL).toBeDefined();
      expect(TEST_EXCHANGE_ARCHIVE_URL).toMatch(/^https:\/\//);
    });

    test('points to scioly.org', () => {
      expect(TEST_EXCHANGE_ARCHIVE_URL).toContain('scioly.org');
    });
  });
});

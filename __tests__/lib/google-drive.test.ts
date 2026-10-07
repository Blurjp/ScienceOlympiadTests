/**
 * Tests for lib/google-drive.ts
 */
import { extractGoogleDriveFileId, toGoogleDriveDirectDownload } from '@/lib/google-drive';

describe('extractGoogleDriveFileId', () => {
  test('extracts from /file/d/ URLs', () => {
    expect(
      extractGoogleDriveFileId('https://drive.google.com/file/d/ABC123_-xyz/view?usp=sharing')
    ).toBe('ABC123_-xyz');
  });

  test('extracts from open?id= URLs', () => {
    expect(
      extractGoogleDriveFileId('https://drive.google.com/open?id=FILE123')
    ).toBe('FILE123');
  });

  test('extracts from uc?id= URLs', () => {
    expect(
      extractGoogleDriveFileId('https://drive.google.com/uc?id=FILE456&export=download')
    ).toBe('FILE456');
  });

  test('extracts from docs.google.com document URLs', () => {
    expect(
      extractGoogleDriveFileId('https://docs.google.com/document/d/DOC123/edit')
    ).toBe('DOC123');
  });

  test('returns null for non-Drive URLs', () => {
    expect(extractGoogleDriveFileId('https://example.com/file.pdf')).toBeNull();
    expect(extractGoogleDriveFileId('https://scioly.org/test.pdf')).toBeNull();
  });

  test('returns null for empty input', () => {
    expect(extractGoogleDriveFileId('')).toBeNull();
  });
});

describe('toGoogleDriveDirectDownload', () => {
  test('builds a direct download URL', () => {
    expect(toGoogleDriveDirectDownload('FILE789')).toBe(
      'https://drive.google.com/uc?export=download&id=FILE789'
    );
  });
});

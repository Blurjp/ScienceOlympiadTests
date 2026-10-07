// Shared Google Drive URL helpers (used by download-pdf route and the
// PDF parser pipeline)

// Extract a Google Drive file ID from various URL formats
export function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Build a direct-download URL from a Google Drive URL (null if not Drive)
export function toGoogleDriveDirectDownload(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

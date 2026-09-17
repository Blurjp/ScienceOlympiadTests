import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import from URL | Science Olympiad Tests',
  description: 'Import Science Olympiad practice tests from a URL, including Google Drive links.',
  robots: { index: false, follow: false },
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}

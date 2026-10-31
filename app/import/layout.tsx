import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Import Past Exam PDFs into Practice Tests',
  description:
    'Turn past Science Olympiad exam PDFs into interactive, timed practice tests. Import from a file or a Google Drive link, keep them private to your account, and track your scores.',
  alternates: { canonical: `${getSiteUrl()}/import` },
  openGraph: {
    title: 'Import Past Exam PDFs into Practice Tests',
    description:
      'Turn past Science Olympiad exam PDFs into interactive, timed practice tests — private to your account.',
    type: 'website',
  },
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}

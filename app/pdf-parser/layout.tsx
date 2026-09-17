import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload PDF | Science Olympiad Tests',
  description: 'Upload a Science Olympiad exam PDF and automatically extract practice questions.',
  robots: { index: false, follow: false },
};

export default function PdfParserLayout({ children }: { children: React.ReactNode }) {
  return children;
}

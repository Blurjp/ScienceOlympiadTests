import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test History | Science Olympiad Tests',
  description: 'View your completed Science Olympiad practice test results and scores.',
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

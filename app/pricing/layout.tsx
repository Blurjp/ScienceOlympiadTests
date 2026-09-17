import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Science Olympiad Tests',
  description: 'Free and Pro plans for AI-generated Science Olympiad practice tests. Compare features and upgrade for unlimited test generation.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

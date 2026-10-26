import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site';

const canonical = `${getSiteUrl()}/pricing`;

export const metadata: Metadata = {
  title: 'Pricing | Science Olympiad Tests',
  description: 'Free and Pro plans for AI-generated Science Olympiad practice tests. Compare features and upgrade for unlimited test generation.',
  alternates: { canonical },
  openGraph: { url: canonical },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

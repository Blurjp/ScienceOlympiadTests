import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSiteUrl } from '@/lib/site';

const canonical = `${getSiteUrl()}/login`;

export const metadata: Metadata = {
  title: 'Sign In | Science Olympiad Tests',
  description: 'Sign in with Google to generate practice tests, import exams, and track your Science Olympiad progress.',
  alternates: { canonical },
  openGraph: {
    url: canonical,
    images: [
      {
        url: `${getSiteUrl()}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'SciolyPrep - AI-generated Science Olympiad practice tests',
      },
    ],
  },
};

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? Go home. (One Tap's router.refresh() also lands here
  // after a silent sign-in on /login, completing the seamless flow.)
  const session = await auth();
  if (session?.user) redirect('/');

  return children;
}

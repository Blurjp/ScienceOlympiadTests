import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sign In | Science Olympiad Tests',
  description: 'Sign in with Google to generate practice tests, import exams, and track your Science Olympiad progress.',
  alternates: { canonical: `${getSiteUrl()}/login` },
};

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? Go home. (One Tap's router.refresh() also lands here
  // after a silent sign-in on /login, completing the seamless flow.)
  const session = await auth();
  if (session?.user) redirect('/');

  return children;
}

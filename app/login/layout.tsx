import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Science Olympiad Tests',
  description: 'Sign in with Google to generate practice tests, import exams, and track your Science Olympiad progress.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

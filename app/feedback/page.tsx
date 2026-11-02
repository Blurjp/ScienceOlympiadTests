import { Suspense } from 'react';
import FeedbackForm from '@/components/feedback-form';

export const metadata = {
  title: 'Feedback — Science Olympiad Tests',
  description: 'Tell us how Science Olympiad Tests is working for you.',
  robots: { index: false },
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}

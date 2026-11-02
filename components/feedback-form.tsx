'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function FeedbackForm() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // One-click score links from the win-back email: /feedback?score=N
  useEffect(() => {
    const s = Number(searchParams.get('score'));
    if (Number.isInteger(s) && s >= 1 && s <= 10) setScore(s);
  }, [searchParams]);

  // Prefill for logged-in users so we can attribute feedback to the account.
  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session?.user?.email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null) {
      setErrorMessage('Please pick a score from 1 to 10.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setErrorMessage('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comment, email, company, context: 'win-back' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h1>
        <p className="text-gray-600 text-sm mb-6">
          Your feedback goes straight to the team building Science Olympiad Tests.
        </p>
        <a
          href="/tests"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse practice tests
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
    >
      <h1 className="text-xl font-semibold text-gray-900 mb-1">How are we doing?</h1>
      <p className="text-gray-500 text-sm mb-6">
        1 = needs work · 10 = love it. It takes ten seconds and shapes what we build next.
      </p>

      <div className="grid grid-cols-10 gap-1 mb-6" role="radiogroup" aria-label="Score from 1 to 10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            aria-checked={score === n}
            role="radio"
            className={`h-10 rounded-lg text-sm font-medium transition-colors ${
              score === n
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
        What would bring you back (or keep you here)?
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="More tests for my events? Better explanations? Tell us — optionally."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
      />

      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
        Email <span className="text-gray-400 font-normal">(only if you want a reply)</span>
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
      />

      {/* Honeypot: invisible to humans, irresistible to bots */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {status === 'error' && (
        <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || score === null}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Sending…' : 'Submit feedback'}
      </button>
    </form>
  );
}

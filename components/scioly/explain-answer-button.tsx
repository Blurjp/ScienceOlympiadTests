'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ProFeatureModal } from '@/components/subscription/pro-feature-modal';
import type { Question } from '@/lib/types';
import { Lightbulb, Loader2 } from 'lucide-react';

interface ExplainAnswerButtonProps {
  /** The question whose answer should be explained. */
  question: Question;
  /** What the student answered (may be empty when skipped). */
  userAnswer?: string;
  /** Button size/placement tweaks. */
  size?: 'default' | 'sm';
  className?: string;
}

/**
 * "Explain answer" action on the results screen — a Pro feature.
 *
 * The button is always visible. Free and signed-out users get the shared
 * upgrade modal instead of an explanation; the server re-verifies Pro status
 * on every request, so a stale session flag can never unlock the endpoint.
 * Explanations render inline beneath the button once loaded and stay
 * expanded (asking again just re-fetches).
 */
export function ExplainAnswerButton({
  question,
  userAnswer,
  size = 'sm',
  className,
}: ExplainAnswerButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = session?.user?.isPro === true;

  const handleExplain = async () => {
    // Fast path: the session already says this user is not Pro.
    if (sessionStatus !== 'authenticated' || !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    // Toggle off is not offered: re-click refreshes the explanation.
    setIsExplaining(true);
    try {
      const response = await fetch('/api/explain-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer || undefined,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        // Signed out, session expired, or Pro check failed server-side.
        setShowUpgradeModal(true);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to generate the explanation. Please try again.');
        return;
      }

      const data = await response.json();
      setExplanation(data.explanation || 'No explanation was returned. Please try again.');
    } catch (error) {
      console.error('AI explanation error:', error);
      alert('Failed to generate the explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleExplain}
        disabled={isExplaining}
        variant="ghost"
        size={size}
        className="gap-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
        title={isPro ? 'Get an AI explanation of this answer' : 'AI explanations are a Pro feature'}
      >
        {isExplaining ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lightbulb className="h-4 w-4" />
        )}
        {explanation ? 'Explain again' : 'Explain answer'}
        {!isPro && sessionStatus === 'authenticated' && (
          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Pro
          </span>
        )}
      </Button>

      {explanation && (
        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-gray-800">
          {explanation}
        </div>
      )}

      <ProFeatureModal
        open={showUpgradeModal}
        title="AI explanations are a Pro feature"
        message="Upgrade to Pro and a built-in AI coach will explain every answer on your results — why it's right, and what to review when it isn't."
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

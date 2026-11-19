'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UpgradeButton } from '@/components/subscription/upgrade-button';

interface ProFeatureModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Headline, e.g. "PDF export is a Pro feature". */
  title: string;
  /** One or two sentences explaining what upgrading unlocks. */
  message: string;
  onClose: () => void;
}

/**
 * The single upgrade-prompt dialog used by every visible-but-locked Pro
 * feature (PDF export, AI answer explanations, 30/40-question tests, the
 * free-tier usage cap). Signed-in users get the upgrade CTA; signed-out
 * users are offered sign-in first, then the plans page.
 */
export function ProFeatureModal({ open, title, message, onClose }: ProFeatureModalProps) {
  const { status: sessionStatus } = useSession();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-feature-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pro-feature-modal-title" className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {sessionStatus === 'authenticated' ? (
            <div className="flex-1">
              <UpgradeButton className="w-full" />
            </div>
          ) : (
            <Link href="/login" className="flex-1">
              <Button className="w-full">Sign in to upgrade</Button>
            </Link>
          )}
          <Link href="/pricing" className="flex-1">
            <Button variant="outline" className="w-full">View plans</Button>
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs text-muted-foreground hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

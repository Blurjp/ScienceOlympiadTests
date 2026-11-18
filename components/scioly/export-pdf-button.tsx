'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import type { Test } from '@/lib/types';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportPdfButtonProps {
  /** Full test object the client already has (e.g. a just-generated test). */
  test?: Test;
  /** Or a stored test id — the server loads it and access-checks ownership. */
  testId?: string;
  /** Button label. */
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * "Export PDF" action for tests — a Pro feature.
 *
 * The button is always visible. Free and signed-out users get an upgrade
 * modal instead of a download; the server re-verifies Pro status on every
 * request, so a stale session flag can never unlock the endpoint.
 *
 * Accepts either a full `test` object or a `testId` (used by library cards
 * and history rows, which only carry summaries — the server fetches the
 * test and enforces the same visibility rules as GET /api/tests/[id]).
 */
export function ExportPdfButton({
  test,
  testId,
  label = 'Export PDF',
  variant = 'outline',
  size,
  className,
}: ExportPdfButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = session?.user?.isPro === true;

  const handleExport = async () => {
    // Fast path: the session already says this user is not Pro.
    if (sessionStatus !== 'authenticated' || !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export-test-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test ? { test } : { testId }),
      });

      if (response.status === 401 || response.status === 403) {
        // Signed out, session expired, or Pro check failed server-side.
        setShowUpgradeModal(true);
        return;
      }

      if (response.status === 404) {
        alert('This test is no longer available to export.');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to export the PDF. Please try again.');
        return;
      }

      // Prefer the server-provided filename; fall back to the local title.
      const disposition = response.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fallback = test
        ? `${test.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'test'}.pdf`
        : 'test.pdf';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameMatch?.[1] || fallback;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant={variant}
        size={size}
        className={className}
        title={isPro ? 'Download this test as a PDF' : 'PDF export is a Pro feature'}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {label}
        {!isPro && sessionStatus === 'authenticated' && (
          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Pro
          </span>
        )}
      </Button>

      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-export-upgrade-title"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="pdf-export-upgrade-title"
              className="mb-2 text-lg font-semibold"
            >
              PDF export is a Pro feature
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upgrade to Pro to download any test as a print-ready PDF with an
              answer key — from the library, your history, or the results screen.
            </p>
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
              onClick={() => setShowUpgradeModal(false)}
              className="mt-3 text-xs text-muted-foreground hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}

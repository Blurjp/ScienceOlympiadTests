'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ProFeatureModal } from '@/components/subscription/pro-feature-modal';
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

  /** Fetch one PDF from the export API and hand back its blob + filename. */
  const fetchPdf = async (payload: Record<string, unknown>) => {
    let response: Response;
    try {
      response = await fetch('/api/export-test-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('Network error — please check your connection and try again.');
    }

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('upgrade'), { upgrade: true });
    }
    if (response.status === 404) {
      throw Object.assign(new Error('missing'), { missing: true });
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to export the PDF. Please try again.');
    }

    // Prefer the server-provided filename; fall back to the local title.
    const disposition = response.headers.get('content-disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const blob = await response.blob();
    return { blob, filename: filenameMatch?.[1] || null };
  };

  /** Trigger a browser download for a fetched blob. */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    // Fast path: the session already says this user is not Pro.
    if (sessionStatus !== 'authenticated' || !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    const basePayload = test ? { test } : { testId };
    const fallbackSlug = test
      ? test.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'test'
      : 'test';

    setIsExporting(true);
    try {
      // Export is a PAIR of files: questions for students, answers for the
      // coach. Sequential downloads with a short gap so browsers don't
      // collapse the second into the first.
      const questions = await fetchPdf({ ...basePayload, includeAnswerKey: false });
      downloadBlob(questions.blob, questions.filename || `${fallbackSlug}_Questions.pdf`);

      await new Promise((resolve) => setTimeout(resolve, 400));

      const answers = await fetchPdf({ ...basePayload, answerKeyOnly: true });
      downloadBlob(answers.blob, answers.filename || `${fallbackSlug}_Answer_Key.pdf`);
    } catch (error: any) {
      if (error?.upgrade) {
        // Signed out, session expired, or Pro check failed server-side.
        setShowUpgradeModal(true);
        return;
      }
      if (error?.missing) {
        alert('This test is no longer available to export.');
        return;
      }
      console.error('PDF export error:', error);
      alert(error?.message || 'Failed to export the PDF. Please try again.');
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

      <ProFeatureModal
        open={showUpgradeModal}
        title="PDF export is a Pro feature"
        message="Upgrade to Pro to download any test as a print-ready PDF with an answer key — from the library, your history, or the results screen."
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

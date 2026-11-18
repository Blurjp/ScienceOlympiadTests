/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { ExportPdfButton } from '@/components/scioly/export-pdf-button';
import type { Test } from '@/lib/types';

// Default (unauthenticated) session — individual tests override the return value.
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/components/subscription/upgrade-button', () => ({
  UpgradeButton: () => <button type="button">Upgrade to Pro</button>,
}));

jest.mock('lucide-react', () => ({
  FileDown: () => <span data-testid="file-down-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
}));

const sampleTest: Test = {
  id: 't1',
  year: 2026,
  title: 'Astronomy Practice',
  description: 'desc',
  difficulty: 'Regional',
  totalTime: 600,
  totalPoints: 5,
  topic: 'Astronomy',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'Which planet is largest?',
      options: ['Earth', 'Jupiter'],
      correctAnswer: 'Jupiter',
      points: 1,
      category: 'Planets',
    },
  ],
};

function setSession(status: string, isPro?: boolean) {
  mockUseSession.mockReturnValue({
    data: status === 'authenticated' ? { user: { id: 'u1', isPro } } : null,
    status,
  } as never);
}

function mockFetchOk() {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    blob: () => Promise.resolve(new Blob(['%PDF-mock'], { type: 'application/pdf' })),
  });
}

function clickAnchorSpy() {
  // jsdom does not implement a.click() downloads; capture the programmatic click.
  const clicks: HTMLAnchorElement[] = [];
  const spy = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this);
    });
  return { clicks, spy };
}

beforeEach(() => {
  jest.clearAllMocks();
  setSession('unauthenticated');

  // jsdom does not implement blob object URLs.
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:mock'),
    });
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });
  }
});

describe('ExportPdfButton', () => {
  test('renders the button with a default label', () => {
    render(<ExportPdfButton test={sampleTest} />);
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
  });

  test('shows a Pro badge for signed-in free users', () => {
    setSession('authenticated', false);
    render(<ExportPdfButton test={sampleTest} />);

    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  test('shows no Pro badge for Pro users', () => {
    setSession('authenticated', true);
    render(<ExportPdfButton test={sampleTest} />);

    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  test('opens the upgrade modal for signed-out users without calling the API', () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as never;
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText('PDF export is a Pro feature')).toBeInTheDocument();
    expect(screen.getByText('Sign in to upgrade')).toBeInTheDocument();
  });

  test('opens the upgrade modal for free users without calling the API', () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as never;
    setSession('authenticated', false);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText('PDF export is a Pro feature')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });

  test('modal can be dismissed', () => {
    setSession('authenticated', false);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));
    fireEvent.click(screen.getByText('Maybe later'));

    expect(screen.queryByText('PDF export is a Pro feature')).not.toBeInTheDocument();
  });

  test('Pro users trigger a download from the export API', async () => {
    const fetchSpy = mockFetchOk();
    global.fetch = fetchSpy as never;
    const { clicks, spy } = clickAnchorSpy();
    setSession('authenticated', true);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/export-test-pdf',
        expect.objectContaining({ method: 'POST' })
      );
    });
    await waitFor(() => {
      expect(clicks.length).toBe(1);
    });
    expect(clicks[0].download).toBe('Astronomy_Practice.pdf');
    spy.mockRestore();
  });

  test('a 403 server response opens the upgrade modal (server is source of truth)', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ upgradeRequired: true }),
    });
    global.fetch = fetchSpy as never;
    setSession('authenticated', true);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    await waitFor(() => {
      expect(screen.getByText('PDF export is a Pro feature')).toBeInTheDocument();
    });
  });

  test('a network error shows an alert', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as never;
    setSession('authenticated', true);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to export the PDF. Please try again.');
    });
    alertSpy.mockRestore();
  });

  test('a non-gating error shows an alert instead of the modal', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'boom' }),
    });
    global.fetch = fetchSpy as never;
    setSession('authenticated', true);
    render(<ExportPdfButton test={sampleTest} />);

    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('boom');
    });
    expect(screen.queryByText('PDF export is a Pro feature')).not.toBeInTheDocument();
    alertSpy.mockRestore();
  });
});

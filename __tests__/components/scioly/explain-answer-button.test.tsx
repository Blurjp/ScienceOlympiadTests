/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { ExplainAnswerButton } from '@/components/scioly/explain-answer-button';
import type { Question } from '@/lib/types';

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/components/subscription/upgrade-button', () => ({
  UpgradeButton: () => <button type="button">Upgrade to Pro</button>,
}));

jest.mock('lucide-react', () => ({
  Lightbulb: () => <span data-testid="lightbulb-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
}));

const question: Question = {
  id: 'q1',
  type: 'multiple-choice',
  question: 'Which planet has the most mass?',
  options: ['Earth', 'Jupiter', 'Mars', 'Venus'],
  correctAnswer: 'Jupiter',
  points: 1,
  category: 'Planets',
};

function setSession(status: string, isPro?: boolean) {
  mockUseSession.mockReturnValue({
    data: status === 'authenticated' ? { user: { id: 'u1', isPro } } : null,
    status,
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  setSession('unauthenticated');
});

describe('ExplainAnswerButton', () => {
  test('renders the button', () => {
    render(<ExplainAnswerButton question={question} />);
    expect(screen.getByRole('button', { name: /Explain answer/i })).toBeInTheDocument();
  });

  test('shows a Pro badge for signed-in free users', () => {
    setSession('authenticated', false);
    render(<ExplainAnswerButton question={question} />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  test('shows no Pro badge for Pro users', () => {
    setSession('authenticated', true);
    render(<ExplainAnswerButton question={question} />);
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  test('opens the upgrade modal for signed-out users without calling the API', () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as never;

    render(<ExplainAnswerButton question={question} />);
    fireEvent.click(screen.getByRole('button', { name: /Explain answer/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText('AI explanations are a Pro feature')).toBeInTheDocument();
    expect(screen.getByText('Sign in to upgrade')).toBeInTheDocument();
  });

  test('opens the upgrade modal for free users', () => {
    setSession('authenticated', false);
    global.fetch = jest.fn() as never;

    render(<ExplainAnswerButton question={question} />);
    fireEvent.click(screen.getByRole('button', { name: /Explain answer/i }));

    expect(screen.getByText('AI explanations are a Pro feature')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });

  test('Pro users get an inline explanation from the API', async () => {
    setSession('authenticated', true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ explanation: 'Jupiter dominates the solar system.' }),
    }) as never;

    render(<ExplainAnswerButton question={question} userAnswer="Earth" />);
    fireEvent.click(screen.getByRole('button', { name: /Explain answer/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/explain-answer',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            userAnswer: 'Earth',
          }),
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Jupiter dominates the solar system.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Explain again/i })).toBeInTheDocument();
  });

  test('a 403 server response opens the upgrade modal (server is source of truth)', async () => {
    setSession('authenticated', true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ upgradeRequired: true }),
    }) as never;

    render(<ExplainAnswerButton question={question} />);
    fireEvent.click(screen.getByRole('button', { name: /Explain answer/i }));

    await waitFor(() => {
      expect(screen.getByText('AI explanations are a Pro feature')).toBeInTheDocument();
    });
  });

  test('a server error shows an alert instead of the modal', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    setSession('authenticated', true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'AI is offline' }),
    }) as never;

    render(<ExplainAnswerButton question={question} />);
    fireEvent.click(screen.getByRole('button', { name: /Explain answer/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('AI is offline');
    });
    expect(screen.queryByText('AI explanations are a Pro feature')).not.toBeInTheDocument();
    alertSpy.mockRestore();
  });
});

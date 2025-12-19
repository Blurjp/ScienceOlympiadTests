/**
 * @jest-environment jsdom
 */
/**
 * Tests for components/scioly/timer.tsx
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Timer } from '@/components/scioly/timer';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Pause: () => <span data-testid="pause-icon">Pause Icon</span>,
  Play: () => <span data-testid="play-icon">Play Icon</span>,
}));

describe('Timer Component', () => {
  const defaultProps = {
    totalTime: 3600, // 1 hour
    isRunning: false,
    onToggle: jest.fn(),
    onTimeUpdate: jest.fn(),
    timeRemaining: 3600,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    test('renders timer with formatted time', () => {
      render(<Timer {...defaultProps} timeRemaining={3665} />);
      expect(screen.getByText('1:01:05')).toBeInTheDocument();
    });

    test('displays Time Remaining label', () => {
      render(<Timer {...defaultProps} />);
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    });

    test('renders pause button when running', () => {
      render(<Timer {...defaultProps} isRunning={true} />);
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    test('renders resume button when paused', () => {
      render(<Timer {...defaultProps} isRunning={false} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    test('renders clock icon', () => {
      render(<Timer {...defaultProps} />);
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('time display colors', () => {
    test('shows blue color when time is above 50%', () => {
      render(<Timer {...defaultProps} timeRemaining={2000} totalTime={3600} />);
      const timeDisplay = screen.getByText(/\d+:\d+/);
      expect(timeDisplay).toHaveClass('text-blue-600');
    });

    test('shows yellow color when time is between 20-50%', () => {
      render(<Timer {...defaultProps} timeRemaining={1000} totalTime={3600} />);
      const timeDisplay = screen.getByText(/\d+:\d+/);
      expect(timeDisplay).toHaveClass('text-yellow-600');
    });

    test('shows red color when time is below 20%', () => {
      render(<Timer {...defaultProps} timeRemaining={500} totalTime={3600} />);
      const timeDisplay = screen.getByText(/\d+:\d+/);
      expect(timeDisplay).toHaveClass('text-red-600');
    });
  });

  describe('toggle functionality', () => {
    test('calls onToggle when button is clicked', () => {
      const onToggle = jest.fn();
      render(<Timer {...defaultProps} onToggle={onToggle} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('countdown functionality', () => {
    test('calls onTimeUpdate every second when running', () => {
      const onTimeUpdate = jest.fn();
      render(
        <Timer
          {...defaultProps}
          isRunning={true}
          timeRemaining={100}
          onTimeUpdate={onTimeUpdate}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onTimeUpdate).toHaveBeenCalledWith(99);
    });

    test('does not call onTimeUpdate when paused', () => {
      const onTimeUpdate = jest.fn();
      render(
        <Timer
          {...defaultProps}
          isRunning={false}
          timeRemaining={100}
          onTimeUpdate={onTimeUpdate}
        />
      );

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onTimeUpdate).not.toHaveBeenCalled();
    });

    test('does not count down when time is 0', () => {
      const onTimeUpdate = jest.fn();
      render(
        <Timer
          {...defaultProps}
          isRunning={true}
          timeRemaining={0}
          onTimeUpdate={onTimeUpdate}
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onTimeUpdate).not.toHaveBeenCalled();
    });
  });

  describe('time up handling', () => {
    test('calls onTimeUp when timer reaches 0', () => {
      const onTimeUp = jest.fn();
      const onTimeUpdate = jest.fn();

      render(
        <Timer
          {...defaultProps}
          isRunning={true}
          timeRemaining={1}
          onTimeUpdate={onTimeUpdate}
          onTimeUp={onTimeUp}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onTimeUp).toHaveBeenCalledTimes(1);
    });

    test('shows times up message when time is 0', () => {
      render(<Timer {...defaultProps} timeRemaining={0} />);
      expect(screen.getByText("Time's up!")).toBeInTheDocument();
    });

    test('does not show times up message when time remains', () => {
      render(<Timer {...defaultProps} timeRemaining={100} />);
      expect(screen.queryByText("Time's up!")).not.toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    test('progress bar width reflects time remaining', () => {
      const { container } = render(
        <Timer {...defaultProps} timeRemaining={1800} totalTime={3600} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });
  });
});

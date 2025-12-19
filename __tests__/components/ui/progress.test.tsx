/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

describe('Progress Component', () => {
  test('renders progress bar', () => {
    render(<Progress data-testid="progress" />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  test('applies default styles', () => {
    render(<Progress data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('relative');
    expect(progress).toHaveClass('h-4');
    expect(progress).toHaveClass('rounded-full');
    expect(progress).toHaveClass('bg-gray-200');
  });

  test('shows 0% progress by default', () => {
    const { container } = render(<Progress />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  test('shows correct percentage for value', () => {
    const { container } = render(<Progress value={50} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  test('uses custom max value', () => {
    const { container } = render(<Progress value={25} max={50} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  test('clamps value at 100%', () => {
    const { container } = render(<Progress value={150} max={100} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  test('clamps value at 0%', () => {
    const { container } = render(<Progress value={-10} max={100} />);
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  test('merges custom className', () => {
    render(<Progress className="custom" data-testid="progress" />);
    expect(screen.getByTestId('progress')).toHaveClass('custom');
  });

  test('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  test('passes through HTML attributes', () => {
    render(<Progress id="progress-bar" data-testid="progress" />);
    expect(screen.getByTestId('progress')).toHaveAttribute('id', 'progress-bar');
  });
});

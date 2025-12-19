/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  test('renders label with text', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('renders as label element', () => {
    render(<Label data-testid="label">Label</Label>);
    const label = screen.getByTestId('label');
    expect(label.tagName).toBe('LABEL');
  });

  test('applies default styles', () => {
    render(<Label data-testid="label">Label</Label>);
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
  });

  test('merges custom className', () => {
    render(<Label className="custom" data-testid="label">Label</Label>);
    expect(screen.getByTestId('label')).toHaveClass('custom');
  });

  test('associates with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Email</Label>
        <input id="test-input" />
      </>
    );
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  test('forwards ref', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  test('passes through HTML attributes', () => {
    render(<Label id="label-id" data-testid="label">Label</Label>);
    expect(screen.getByTestId('label')).toHaveAttribute('id', 'label-id');
  });
});

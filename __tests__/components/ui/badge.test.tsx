/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '@/components/ui/badge';

describe('Badge Component', () => {
  test('renders with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  test('applies default variant styles', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-blue-100');
  });

  test('applies secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-purple-100');
  });

  test('applies destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-red-100');
  });

  test('applies outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('text-gray-900');
  });

  test('applies success variant', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-green-100');
  });

  test('applies warning variant', () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-yellow-100');
  });

  test('merges custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('custom-class');
  });

  test('passes through HTML attributes', () => {
    render(<Badge id="test-badge" data-testid="badge">Test</Badge>);
    expect(screen.getByTestId('badge')).toHaveAttribute('id', 'test-badge');
  });

  describe('badgeVariants function', () => {
    test('returns default variant classes', () => {
      const classes = badgeVariants();
      expect(classes).toContain('bg-blue-100');
    });

    test('returns variant-specific classes', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-red-100');
    });
  });
});

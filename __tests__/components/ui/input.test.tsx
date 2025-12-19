/**
 * @jest-environment jsdom
 */
/**
 * Tests for components/ui/input.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  describe('rendering', () => {
    test('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('applies default styles', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-10');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
    });

    test('merges custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('input types', () => {
    test('renders text input by default', () => {
      render(<Input data-testid="input" />);
      // When type is not specified, the default browser behavior is text
      const input = screen.getByTestId('input');
      expect(input.tagName).toBe('INPUT');
    });

    test('renders password input', () => {
      render(<Input type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    });

    test('renders email input', () => {
      render(<Input type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    });

    test('renders number input', () => {
      render(<Input type="number" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });
  });

  describe('interactions', () => {
    test('handles value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalled();
    });

    test('displays controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    test('handles focus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalled();
    });

    test('handles blur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      fireEvent.blur(screen.getByRole('textbox'));
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    test('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    test('applies disabled styles', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('ref forwarding', () => {
    test('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    test('ref can be used to focus input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('HTML attributes', () => {
    test('passes through id attribute', () => {
      render(<Input id="test-input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('id', 'test-input');
    });

    test('passes through name attribute', () => {
      render(<Input name="test-name" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('name', 'test-name');
    });

    test('passes through required attribute', () => {
      render(<Input required data-testid="input" />);
      expect(screen.getByTestId('input')).toBeRequired();
    });

    test('passes through aria attributes', () => {
      render(<Input aria-label="Test input" aria-describedby="desc" />);
      const input = screen.getByLabelText('Test input');
      expect(input).toHaveAttribute('aria-describedby', 'desc');
    });

    test('passes through maxLength attribute', () => {
      render(<Input maxLength={10} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('maxLength', '10');
    });
  });
});

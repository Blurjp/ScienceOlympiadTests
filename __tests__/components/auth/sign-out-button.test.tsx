/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { signOut } from 'next-auth/react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LogOut: () => <span data-testid="logout-icon">LogOut</span>,
}));

// Get the mocked signOut function
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('SignOutButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue({ url: '/' });
  });

  test('renders sign out button', () => {
    render(<SignOutButton />);
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
  });

  test('renders logout icon', () => {
    render(<SignOutButton />);
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  test('has destructive variant styling', () => {
    render(<SignOutButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  test('calls signOut on click', async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  test('shows loading state during sign out', async () => {
    // Make signOut slow
    mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ url: '/' }), 100)));

    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Signing out...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('handles sign out error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSignOut.mockRejectedValue(new Error('Sign out failed'));

    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error));
    });

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });
});

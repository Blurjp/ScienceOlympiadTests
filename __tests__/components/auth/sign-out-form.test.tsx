/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignOutForm } from '@/components/auth/sign-out-form';

describe('SignOutForm Component', () => {
  test('renders its children inside a form', () => {
    render(
      <SignOutForm action={async () => {}}>
        <button type="submit">Sign Out</button>
      </SignOutForm>
    );
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    expect(screen.getByRole('button').closest('form')).not.toBeNull();
  });

  test('disables Google auto-select when the form is submitted', () => {
    const disableAutoSelect = jest.fn();
    (window as unknown as { google: unknown }).google = {
      accounts: { id: { disableAutoSelect } },
    };

    render(
      <SignOutForm action={async () => {}}>
        <button type="submit">Sign Out</button>
      </SignOutForm>
    );

    fireEvent.submit(screen.getByRole('button').closest('form')!);
    expect(disableAutoSelect).toHaveBeenCalled();
  });

  test('submit is safe when GSI is not loaded', () => {
    delete (window as unknown as { google?: unknown }).google;
    render(
      <SignOutForm action={async () => {}}>
        <button type="submit">Sign Out</button>
      </SignOutForm>
    );

    expect(() => {
      fireEvent.submit(screen.getByRole('button').closest('form')!);
    }).not.toThrow();
  });
});

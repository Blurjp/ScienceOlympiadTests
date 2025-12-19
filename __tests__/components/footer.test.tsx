/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/footer';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Footer Component', () => {
  test('renders copyright text with current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    expect(screen.getByText(/Pathvana LLC/)).toBeInTheDocument();
  });

  test('renders privacy policy link', () => {
    render(<Footer />);
    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
  });

  test('renders terms of service link', () => {
    render(<Footer />);
    const termsLink = screen.getByText('Terms of Service');
    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest('a')).toHaveAttribute('href', '/terms');
  });

  test('renders disclaimer text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/Not affiliated with Science Olympiad, Inc/)
    ).toBeInTheDocument();
  });

  test('renders SO logo', () => {
    render(<Footer />);
    expect(screen.getByText('SO')).toBeInTheDocument();
  });
});

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

// Hook to handle home navigation with state reset
function useHomeNavigation() {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      // Dispatch a custom event to notify the home page to reset state
      window.dispatchEvent(new CustomEvent('reset-home-view'));
      // Scroll to top
      window.scrollTo(0, 0);
    }
    // If not on home page, let the Link navigate normally
  };

  return handleClick;
}

export function HomeNavLink() {
  const handleClick = useHomeNavigation();

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
    >
      <Home className="w-4 h-4 mr-1" />
      Home
    </Link>
  );
}

export function HomeLogo() {
  const handleClick = useHomeNavigation();

  return (
    <Link href="/" onClick={handleClick} className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold">SO</span>
      </div>
      <span className="font-bold text-xl hidden sm:inline">SciOly Tests</span>
    </Link>
  );
}

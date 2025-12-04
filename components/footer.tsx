import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">SO</span>
            </div>
            <span className="text-sm text-gray-600">
              &copy; {currentYear} SciOly Prep. All rights reserved.
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-gray-500">
            This is an independent practice platform. Not affiliated with Science Olympiad, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

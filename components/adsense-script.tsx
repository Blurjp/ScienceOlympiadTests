'use client';

import Script from 'next/script';

/**
 * Loads the Google AdSense script ONLY on screens that render ad units.
 * Kept out of the root layout so no Google-served ads can appear on
 * screens without publisher-content (login, admin, tool pages, etc.).
 */
export function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || 'ca-pub-5272449326201280';
  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}

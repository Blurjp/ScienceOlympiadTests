'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style,
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  const adClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  if (!adClient) {
    // Don't render ads if AdSense ID is not configured
    return null;
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

// Horizontal banner ad - good for between sections
export function HorizontalAd({ adSlot, className = '' }: { adSlot: string; className?: string }) {
  return (
    <AdSense
      adSlot={adSlot}
      adFormat="horizontal"
      className={`my-4 ${className}`}
    />
  );
}

// Rectangle ad - good for sidebars
export function RectangleAd({ adSlot, className = '' }: { adSlot: string; className?: string }) {
  return (
    <AdSense
      adSlot={adSlot}
      adFormat="rectangle"
      className={className}
    />
  );
}

// In-feed ad - good for between content items
export function InFeedAd({ adSlot, className = '' }: { adSlot: string; className?: string }) {
  return (
    <AdSense
      adSlot={adSlot}
      adFormat="auto"
      className={`my-6 ${className}`}
    />
  );
}

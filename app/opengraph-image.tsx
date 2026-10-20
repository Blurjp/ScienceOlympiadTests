import { ImageResponse } from 'next/og';
import { getSiteUrl } from '@/lib/site';

// Social preview image (Open Graph), applied to every route via Next.js
// file-based metadata conventions. Rendered once and cached by the platform.
export const runtime = 'edge';

export const alt =
  'SciolyPrep - AI-generated Science Olympiad practice tests for 32 Division B and C events';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  const host = getSiteUrl()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #7c3aed 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#f59e0b',
              color: '#1e1b4b',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            SO
          </div>
          <div style={{ fontSize: 26, letterSpacing: 2, color: '#ddd6fe' }}>
            SCIENCE OLYMPIAD · DIVISION C
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 92, fontWeight: 700 }}>
          SciolyPrep
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 40,
            marginTop: 16,
            color: '#ede9fe',
          }}
        >
          AI-generated Science Olympiad practice tests
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            marginTop: 40,
            color: '#c4b5fd',
          }}
        >
          32 Division B and C events · Invitational to National difficulty · PDF import ·
          Progress tracking
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            fontSize: 24,
            color: '#a78bfa',
          }}
        >
          {host} · Free to start
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Creative Utilities - Free Developer Tools';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b', // zinc-950
          backgroundImage: 'radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            backgroundImage: 'radial-gradient(circle, rgba(0, 240, 160, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            gap: 20,
          }}
        >
          {/* Icon Container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: 40,
              backgroundColor: 'rgba(39, 39, 42, 0.5)', // zinc-800/50
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
           {/* Sparkles Icon */}
           <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00F0A0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M9 3v4" />
              <path d="M7 5H3" />
              <path d="M7 5h4" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div
              style={{
                fontSize: 70,
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Creative Utilities
            </div>
            
            <div
               style={{
                 fontSize: 32,
                 color: '#a1a1aa', // zinc-400
                 textAlign: 'center',
                 maxWidth: 800,
                 lineHeight: 1.4,
               }}
            >
              Free, privacy-focused tools running in your browser.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

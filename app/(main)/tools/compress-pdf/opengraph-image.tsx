import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Compress PDF - Reduce File Size Online';
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
            backgroundImage: 'radial-gradient(circle, rgba(0, 243, 190, 0.15) 0%, transparent 70%)',
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
           {/* Minimize2 Icon */}
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
              <path d="M4 14h6v6" />
              <path d="M20 10h-6V4" />
              <path d="m14 10 7-7" />
              <path d="m3 21 7-7" />
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
              }}
            >
              Compress PDF
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
              Reduce PDF file size securely in your browser.
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

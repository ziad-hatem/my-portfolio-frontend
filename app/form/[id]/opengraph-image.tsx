import { ImageResponse } from 'next/og'
import { getForm } from '@/lib/form-actions'
 
// MongoDB driver (used in getForm) requires Node.js runtime, not Edge.
export const runtime = 'nodejs'
 
// Image metadata
export const alt = 'Form Preview'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getForm(id)
  const formName = form?.name || 'Untitled Form'
 
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background Gradient */}
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom right, #000000 0%, #111111 100%)',
                zIndex: 0,
            }}
        />

        {/* Decorator */}
        <div
            style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)',
                top: '-10%',
                zIndex: 1,
            }}
        />

        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3b82f6', // blue-500
                    color: 'white',
                    borderRadius: '100%',
                    width: '80px',
                    height: '80px',
                    fontSize: 40,
                    marginBottom: 40,
                }}
            >
                F
            </div>
            
            <div
                style={{
                    fontSize: 60,
                    fontWeight: 800,
                    color: 'white',
                    textAlign: 'center',
                    maxWidth: '900px',
                    lineHeight: 1.1,
                    marginBottom: 20,
                    textShadow: '0 0 40px rgba(255,255,255,0.2)',
                }}
            >
                {formName}
            </div>

            <div
                style={{
                    fontSize: 24,
                    color: '#a1a1aa', // zinc-400
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                }}
            >
                Submissions Open
            </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

// Track user sessions

import { NextRequest, NextResponse } from 'next/server';
import { startSession, endSession } from '@/lib/user-profile-manager';
import { getLocationFromIP } from '@/lib/geolocation-service';
import { fingerprintRateLimiter } from '@/lib/rate-limit';
import type { Session } from '@/lib/user-profile-types';

/**
 * POST /api/track/session
 * Start a new session
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = req.ip || 'anonymous';
    try {
      await fingerprintRateLimiter.check(identifier, 20);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, device } = body;

    if (!userId || !device) {
      return NextResponse.json(
        { success: false, error: 'userId and device are required' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Get location from IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = req.ip || realIp || forwardedFor?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);

    const session: Session = {
      sessionId,
      startTime: new Date(),
      pageViews: 0,
      interactions: 0,
      location: location || undefined,
      device,
    };

    await startSession(userId, session);

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/track/session
 * End an existing session
 */
export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = req.ip || 'anonymous';
    try {
      await fingerprintRateLimiter.check(identifier, 20);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, sessionId, duration, pageViewCount, interactionCount } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'userId and sessionId are required' },
        { status: 400 }
      );
    }

    await endSession(
      userId,
      sessionId,
      duration || 0,
      pageViewCount || 0,
      interactionCount || 0
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

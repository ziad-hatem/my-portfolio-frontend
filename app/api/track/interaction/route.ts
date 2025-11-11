// Track user interactions

import { NextRequest, NextResponse } from 'next/server';
import { trackInteraction } from '@/lib/user-profile-manager';
import { fingerprintRateLimiter } from '@/lib/rate-limit';
import type { Interaction } from '@/lib/user-profile-types';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = req.ip || 'anonymous';
    try {
      await fingerprintRateLimiter.check(identifier, 50); // 50 requests per minute
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, type, element, elementId, elementClass, data, page } = body;

    if (!userId || !type || !page) {
      return NextResponse.json(
        { success: false, error: 'userId, type, and page are required' },
        { status: 400 }
      );
    }

    const interaction: Interaction = {
      type: type as any,
      element,
      elementId,
      elementClass,
      data,
      timestamp: new Date(),
      page,
    };

    await trackInteraction(userId, interaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Interaction tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

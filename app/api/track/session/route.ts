// Track user sessions

import { NextRequest, NextResponse } from "next/server";
import { startSession, endSession } from "@/lib/user-profile-manager";
import { getLocationFromIP } from "@/lib/geolocation-service";
import { fingerprintRateLimiter } from "@/lib/rate-limit";
import type { Session } from "@/lib/user-profile-types";

/**
 * POST /api/track/session
 * Start a new session
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    // @ts-ignore
    const identifier = req.ip || "anonymous";
    try {
      await fingerprintRateLimiter.check(identifier, 20);
    } catch {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, device } = body;

    console.log("[Track Session] Starting session for user:", userId);

    if (!userId || !device) {
      return NextResponse.json(
        { success: false, error: "userId and device are required" },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `ses_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Get location from IP with correct priority for production
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    let ip = "unknown";
    if (forwardedFor) {
      ip = forwardedFor.split(",")[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
      // @ts-ignore
    } else if (req.ip) {
      // @ts-ignore
      ip = req.ip;
    }

    console.log("[Track Session] Extracted IP:", ip, "from headers:", {
      forwardedFor,
      realIp,
      // @ts-ignore
      reqIp: req.ip,
    });

    const location = await getLocationFromIP(ip);

    console.log("[Track Session] Location result:", location);

    const session: Session = {
      sessionId,
      startTime: new Date(),
      pageViews: 0,
      interactions: 0,
      location: location || undefined,
      device,
    };

    await startSession(userId, session);

    // Also add location to profile if we got a valid location
    if (location && location.country !== "Unknown") {
      console.log(
        "[Track Session] Adding location to profile:",
        location.city,
        location.country
      );
      const { addLocationToProfile } = await import(
        "@/lib/user-profile-manager"
      );
      await addLocationToProfile(userId, location);
    }

    console.log(
      "[Track Session] Session created:",
      sessionId,
      "for user:",
      userId
    );

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("[Track Session] Session start error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
    // @ts-ignore
    const identifier = req.ip || "anonymous";
    try {
      await fingerprintRateLimiter.check(identifier, 20);
    } catch {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, sessionId, duration, pageViewCount, interactionCount } =
      body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "userId and sessionId are required" },
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
    console.error("Session end error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

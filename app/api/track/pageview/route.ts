// Track page views

import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/user-profile-manager";
import { fingerprintRateLimiter } from "@/lib/rate-limit";
import type { PageView } from "@/lib/user-profile-types";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    // @ts-ignore
    const identifier = req.ip || "anonymous";
    try {
      await fingerprintRateLimiter.check(identifier, 30); // 30 requests per minute
    } catch {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, url, title, referrer, duration, scrollDepth } = body;

    console.log(
      "[Track PageView] Tracking page view for user:",
      userId,
      "url:",
      url
    );

    if (!userId || !url) {
      return NextResponse.json(
        { success: false, error: "userId and url are required" },
        { status: 400 }
      );
    }

    // Parse URL to get pathname
    let pathname = "/";
    try {
      const urlObj = new URL(url);
      pathname = urlObj.pathname;
    } catch {
      pathname = url;
    }

    const pageView: PageView = {
      url,
      pathname,
      title: title || "Untitled",
      referrer: referrer || "",
      timestamp: new Date(),
      duration,
      scrollDepth,
    };

    await trackPageView(userId, pageView);

    console.log("[Track PageView] Page view tracked:", pathname);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Track PageView] Page view tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

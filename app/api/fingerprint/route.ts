// Main fingerprint API endpoint

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDatabase } from "@/lib/mongodb";
import { fingerprintRateLimiter } from "@/lib/rate-limit";
import { identifyUser } from "@/lib/identity-resolver";
import {
  detectInconsistencies,
  calculateBotScore,
} from "@/lib/fingerprint-matcher";
import { getLocationFromIP } from "@/lib/geolocation-service";
import {
  getOrCreateUserProfile,
  addLocationToProfile,
} from "@/lib/user-profile-manager";
import type {
  FingerprintRequest,
  FingerprintResponse,
  FingerprintData,
  CompositeFingerprintData,
  NetworkInfo,
  FingerprintRecord,
} from "@/lib/fingerprint-types";

/**
 * Generate deterministic hash from fingerprint data
 */
function generateFingerprintHash(data: any): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Extract network-level identifiers from request
 * Priority: x-forwarded-for (most common in production) > x-real-ip > req.ip
 */
function extractNetworkInfo(req: NextRequest): NetworkInfo {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  // Extract IP with correct priority for production environments
  let ip = "unknown";
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    ip = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
    // @ts-ignore
  } else if (req?.ip) {
    // @ts-ignore
    ip = req?.ip;
  }

  return {
    ip,
    userAgent: req.headers.get("user-agent") || "unknown",
    acceptLanguage: req.headers.get("accept-language") || "",
    acceptEncoding: req.headers.get("accept-encoding") || "",
  };
}

/**
 * POST /api/fingerprint
 * Simplified endpoint for fingerprint tracking with location
 */
export async function POST(req: NextRequest) {
  try {
    // Extract identifier for rate limiting
    const identifier =
      // @ts-ignore
      req.ip || req.headers.get("x-forwarded-for") || "anonymous";

    // Rate limiting check
    try {
      await fingerprintRateLimiter.check(identifier, 10); // 10 requests per minute
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    if (!body.fingerprint || !body.hash) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { fingerprint, hash: fingerprintHash, existingUserId } = body;

    // Extract network information (IP address)
    const networkInfo = extractNetworkInfo(req);

    // Get database connection
    const db = await getDatabase();
    const fingerprintsCollection = db.collection("fingerprints");
    const usersCollection = db.collection("users");

    let userId: string;
    let isNewUser = false;

    // Check if fingerprint already exists
    let fingerprintRecord = await fingerprintsCollection.findOne({
      hash: fingerprintHash,
    });

    if (fingerprintRecord) {
      // Fingerprint exists - use existing user ID
      userId = fingerprintRecord.userId;

      // Update last seen
      await fingerprintsCollection.updateOne(
        { _id: fingerprintRecord._id },
        {
          $set: { lastSeen: new Date() },
          $inc: { seenCount: 1 },
        }
      );
    } else {
      // New fingerprint - create new user or use provided user ID
      if (existingUserId) {
        // User has an existing ID in localStorage
        userId = existingUserId;
      } else {
        // Generate new user ID
        userId = `user_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        isNewUser = true;
      }

      // Create new fingerprint record
      const newFingerprintRecord = {
        hash: fingerprintHash,
        data: {
          ...fingerprint,
          network: networkInfo,
        },
        userId,
        createdAt: new Date(),
        lastSeen: new Date(),
        seenCount: 1,
        confidence: 1.0,
      };

      await fingerprintsCollection.insertOne(newFingerprintRecord);
      ("[Fingerprint] Created new fingerprint record");
    }

    // Update user's last seen timestamp
    await usersCollection.updateOne(
      { userId },
      {
        $set: { lastSeen: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Create or update user profile
    await getOrCreateUserProfile(userId);

    // Fetch location from IP-API
    const location = await getLocationFromIP(networkInfo.ip);

    if (location && location.country !== "Unknown") {
      // Add location to user profile
      await addLocationToProfile(userId, location);
    } else {
    }

    // Return response with location data
    return NextResponse.json({
      success: true,
      userId,
      isNewUser,
      location: location && location.country !== "Unknown" ? location : null,
    });
  } catch (error) {
    console.error("[Fingerprint] Processing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fingerprint?userId=xxx
 * Retrieve user information and associated fingerprints
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId parameter required" },
        { status: 400 }
      );
    }

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

    const db = await getDatabase();
    const fingerprintsCollection =
      db.collection<FingerprintRecord>("fingerprints");
    const usersCollection = db.collection("users");

    // Get user
    const user = await usersCollection.findOne({ userId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's fingerprints
    const fingerprints = await fingerprintsCollection
      .find({ userId })
      .sort({ lastSeen: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      userId: user.userId,
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      fingerprintCount: fingerprints.length,
      fingerprints: fingerprints.map((fp) => ({
        id: fp._id?.toString(),
        hash: fp.hash,
        createdAt: fp.createdAt,
        lastSeen: fp.lastSeen,
        seenCount: fp.seenCount,
        confidence: fp.confidence,
        suspicious: fp.suspicious,
      })),
    });
  } catch (error) {
    console.error("User retrieval error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

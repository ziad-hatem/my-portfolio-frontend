// Main fingerprint API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { fingerprintRateLimiter } from '@/lib/rate-limit';
import { identifyUser } from '@/lib/identity-resolver';
import {
  detectInconsistencies,
  calculateBotScore,
} from '@/lib/fingerprint-matcher';
import { getLocationFromIP } from '@/lib/geolocation-service';
import { getOrCreateUserProfile, addLocationToProfile } from '@/lib/user-profile-manager';
import type {
  FingerprintRequest,
  FingerprintResponse,
  FingerprintData,
  CompositeFingerprintData,
  NetworkInfo,
  FingerprintRecord,
} from '@/lib/fingerprint-types';

/**
 * Generate deterministic hash from fingerprint data
 */
function generateFingerprintHash(data: any): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Extract network-level identifiers from request
 */
function extractNetworkInfo(req: NextRequest): NetworkInfo {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  return {
    ip: req.ip || realIp || forwardedFor?.split(',')[0] || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    acceptLanguage: req.headers.get('accept-language') || '',
    acceptEncoding: req.headers.get('accept-encoding') || '',
  };
}

/**
 * POST /api/fingerprint
 * Main endpoint for receiving and processing browser fingerprints
 */
export async function POST(req: NextRequest) {
  try {
    // Extract identifier for rate limiting
    const identifier = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limiting check
    try {
      await fingerprintRateLimiter.check(identifier, 10); // 10 requests per minute
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body: FingerprintRequest = await req.json();

    if (!body.fingerprint || !body.hash) {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const { fingerprint, hash: clientHash } = body;

    // Extract network information
    const networkInfo = extractNetworkInfo(req);

    // Create composite fingerprint (browser + network)
    const compositeFingerprint: CompositeFingerprintData = {
      ...fingerprint,
      network: networkInfo,
    };

    // Generate server-side hash
    const compositeHash = generateFingerprintHash(compositeFingerprint);

    // Detect suspicious patterns
    const inconsistencies = detectInconsistencies(fingerprint);
    const botScore = calculateBotScore(fingerprint);
    const isSuspicious = inconsistencies.length > 2 || botScore > 70;

    // Block obvious bots
    if (botScore > 85) {
      return NextResponse.json(
        { success: false, error: 'Automated access detected' },
        { status: 403 }
      );
    }

    // Get database connection
    const db = await getDatabase();
    const fingerprintsCollection = db.collection<FingerprintRecord>('fingerprints');
    const usersCollection = db.collection('users');

    // Check for exact match
    let fingerprintRecord = await fingerprintsCollection.findOne({
      hash: compositeHash,
    });

    let userId: string;
    let isNewUser = false;
    let confidence = 1.0;

    if (fingerprintRecord) {
      // Exact match found - update last seen
      userId = fingerprintRecord.userId;

      await fingerprintsCollection.updateOne(
        { _id: fingerprintRecord._id },
        {
          $set: { lastSeen: new Date() },
          $inc: { seenCount: 1 },
        }
      );
    } else {
      // No exact match - try identity resolution (fuzzy matching)
      const identityResult = await identifyUser(
        compositeHash,
        fingerprint,
        networkInfo.ip
      );

      userId = identityResult.userId;
      confidence = identityResult.confidence;
      isNewUser = identityResult.method === 'new_user';

      // Create new fingerprint record
      const newFingerprintRecord: FingerprintRecord = {
        hash: compositeHash,
        data: compositeFingerprint,
        userId,
        createdAt: new Date(),
        lastSeen: new Date(),
        seenCount: 1,
        confidence,
        suspicious: isSuspicious,
        suspiciousReasons: inconsistencies,
      };

      const insertResult = await fingerprintsCollection.insertOne(
        newFingerprintRecord as any
      );

      fingerprintRecord = {
        ...newFingerprintRecord,
        _id: insertResult.insertedId.toString(),
      };
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

    // Get and store location data
    const location = await getLocationFromIP(networkInfo.ip);
    if (location) {
      await addLocationToProfile(userId, location);
    }

    // Return response
    const response: FingerprintResponse = {
      success: true,
      userId,
      fingerprintId: fingerprintRecord._id?.toString() || '',
      isNewUser,
      confidence,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fingerprint processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

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

    const db = await getDatabase();
    const fingerprintsCollection = db.collection<FingerprintRecord>('fingerprints');
    const usersCollection = db.collection('users');

    // Get user
    const user = await usersCollection.findOne({ userId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
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
      fingerprints: fingerprints.map(fp => ({
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
    console.error('User retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

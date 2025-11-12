// Fingerprint statistics and analytics endpoint

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { analyticsRateLimiter } from "@/lib/rate-limit";
import {
  calculateObservedEntropy,
  formatEntropy,
  getTheoreticalTotalEntropy,
  analyzeAttributeDistribution,
} from "@/lib/entropy-calculator";
import type {
  FingerprintRecord,
  FingerprintStats,
} from "@/lib/fingerprint-types";

/**
 * GET /api/fingerprint/stats
 * Retrieve fingerprinting statistics and analytics
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    // @ts-ignore
    const identifier = req.ip || "anonymous";
    try {
      await analyticsRateLimiter.check(identifier, 10); // 10 requests per minute
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

    // Get basic counts
    const totalFingerprints = await fingerprintsCollection.countDocuments();
    const uniqueUsers = await usersCollection.countDocuments();
    const suspiciousCount = await fingerprintsCollection.countDocuments({
      suspicious: true,
    });

    // Get counts for time windows
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const lastHourCount = await fingerprintsCollection.countDocuments({
      createdAt: { $gte: oneHourAgo },
    });

    const last24HourCount = await fingerprintsCollection.countDocuments({
      createdAt: { $gte: oneDayAgo },
    });

    // Calculate average confidence and revisits
    const aggregateResult = await fingerprintsCollection
      .aggregate([
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: "$confidence" },
            avgSeenCount: { $avg: "$seenCount" },
          },
        },
      ])
      .toArray();

    const avgConfidence =
      aggregateResult.length > 0 ? aggregateResult[0].avgConfidence : 1.0;
    const avgRevisits =
      aggregateResult.length > 0 ? aggregateResult[0].avgSeenCount : 1.0;

    // Calculate observed entropy
    const hashCounts = await fingerprintsCollection
      .aggregate([
        {
          $group: {
            _id: "$hash",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const hashCountMap = new Map(
      hashCounts.map((item) => [item._id, item.count])
    );

    const observedEntropy = calculateObservedEntropy(hashCountMap);
    const theoreticalEntropy = getTheoreticalTotalEntropy();

    // Get sample fingerprints for attribute analysis
    const sampleFingerprints = await fingerprintsCollection
      .find()
      .limit(1000)
      .toArray();

    // Analyze key attributes
    const userAgents = sampleFingerprints.map((fp) => fp.data.basic.userAgent);
    const timezones = sampleFingerprints.map(
      (fp) => fp.data.basic.timezone.timezone
    );
    const languages = sampleFingerprints.map((fp) => fp.data.basic.language);

    const userAgentDistribution = analyzeAttributeDistribution(
      "User-Agent",
      userAgents
    );
    const timezoneDistribution = analyzeAttributeDistribution(
      "Timezone",
      timezones
    );
    const languageDistribution = analyzeAttributeDistribution(
      "Language",
      languages
    );

    // Build stats response
    const stats: FingerprintStats & {
      entropy: any;
      attributeDistributions: any;
    } = {
      totalFingerprints,
      uniqueUsers,
      avgConfidence,
      avgRevisits,
      suspiciousCount,
      lastHourCount,
      last24HourCount,
      entropy: {
        observed: observedEntropy.toFixed(2),
        theoretical: theoreticalEntropy.toFixed(2),
        uniqueness: formatEntropy(observedEntropy),
        theoreticalUniqueness: formatEntropy(theoreticalEntropy),
      },
      attributeDistributions: {
        userAgent: userAgentDistribution,
        timezone: timezoneDistribution,
        language: languageDistribution,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stats retrieval error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

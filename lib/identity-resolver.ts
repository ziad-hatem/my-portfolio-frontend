// Identity resolution using multiple signals

import { getDatabase } from './mongodb';
import type {
  FingerprintData,
  FingerprintRecord,
  MatchResult,
} from './fingerprint-types';
import { findBestMatch } from './fingerprint-matcher';

interface IdentitySignal {
  type: 'fingerprint' | 'ip' | 'session';
  value: string;
  confidence: number;
  timestamp: Date;
}

export class IdentityResolver {
  private signals: IdentitySignal[] = [];

  addSignal(signal: IdentitySignal): void {
    this.signals.push(signal);
  }

  /**
   * Resolve identity using multiple signals
   * Returns user ID, confidence score, and matching method
   */
  async resolveIdentity(
    fingerprintHash: string,
    fingerprint: FingerprintData
  ): Promise<MatchResult> {
    const db = await getDatabase();
    const fingerprintsCollection = db.collection<FingerprintRecord>('fingerprints');
    const usersCollection = db.collection('users');

    // 1. Try exact fingerprint match (highest confidence)
    const exactMatch = await fingerprintsCollection.findOne({ hash: fingerprintHash });

    if (exactMatch) {
      return {
        userId: exactMatch.userId,
        confidence: 0.95,
        method: 'exact_fingerprint',
      };
    }

    // 2. Try fuzzy fingerprint matching
    const recentFingerprints = await fingerprintsCollection
      .find({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      })
      .limit(500)
      .toArray();

    const fuzzyMatch = findBestMatch(fingerprint, recentFingerprints, 0.85);

    if (fuzzyMatch) {
      return {
        userId: fuzzyMatch.match.userId,
        confidence: fuzzyMatch.similarity * 0.9, // Slightly lower confidence for fuzzy
        method: 'fuzzy_fingerprint',
      };
    }

    // 3. Try IP-based matching (lower confidence)
    const ipSignal = this.signals.find(s => s.type === 'ip');

    if (ipSignal) {
      const ipMatches = await fingerprintsCollection
        .find({
          'data.network.ip': ipSignal.value,
          lastSeen: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        })
        .sort({ lastSeen: -1 })
        .limit(1)
        .toArray();

      if (ipMatches.length > 0) {
        return {
          userId: ipMatches[0].userId,
          confidence: 0.6,
          method: 'ip_recent',
        };
      }
    }

    // 4. No match - create new user
    const userId = generateUserId();
    await usersCollection.insertOne({
      userId,
      createdAt: new Date(),
      lastSeen: new Date(),
    });

    return {
      userId,
      confidence: 1.0,
      method: 'new_user',
    };
  }
}

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `usr_${timestamp}_${randomStr}`;
}

/**
 * Main function to identify a user based on fingerprint and network info
 */
export async function identifyUser(
  fingerprintHash: string,
  fingerprint: FingerprintData,
  ip: string
): Promise<MatchResult> {
  const resolver = new IdentityResolver();

  // Add fingerprint signal
  resolver.addSignal({
    type: 'fingerprint',
    value: fingerprintHash,
    confidence: 0.9,
    timestamp: new Date(),
  });

  // Add IP signal
  resolver.addSignal({
    type: 'ip',
    value: ip,
    confidence: 0.5,
    timestamp: new Date(),
  });

  return await resolver.resolveIdentity(fingerprintHash, fingerprint);
}

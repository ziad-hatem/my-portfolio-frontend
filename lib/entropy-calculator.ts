// Entropy calculation and uniqueness analysis

import type { EntropyAttribute } from './fingerprint-types';

/**
 * Calculate Shannon entropy for an attribute
 * Returns entropy in bits
 */
export function calculateEntropy(attr: EntropyAttribute): number {
  if (attr.distribution) {
    // Use actual distribution
    return -attr.distribution.reduce((sum, p) => {
      return p > 0 ? sum + p * Math.log2(p) : sum;
    }, 0);
  } else {
    // Assume uniform distribution
    return Math.log2(attr.cardinality);
  }
}

/**
 * Calculate total entropy from multiple attributes
 */
export function calculateTotalEntropy(attributes: EntropyAttribute[]): number {
  return attributes.reduce((sum, attr) => sum + calculateEntropy(attr), 0);
}

/**
 * Calculate collision probability using birthday paradox
 */
export function calculateCollisionProbability(
  entropyBits: number,
  populationSize: number
): number {
  const uniqueFingerprints = Math.pow(2, entropyBits);

  // Birthday paradox approximation
  const probability =
    1 - Math.exp((-populationSize * (populationSize - 1)) / (2 * uniqueFingerprints));

  return probability;
}

/**
 * Estimate uniqueness (1 in X)
 */
export function estimateUniqueness(entropyBits: number): number {
  return Math.pow(2, entropyBits);
}

/**
 * Theoretical entropy values for common fingerprint attributes
 */
export const THEORETICAL_ENTROPY: EntropyAttribute[] = [
  { name: 'User-Agent', cardinality: 1000 }, // ~10 bits
  { name: 'Screen Resolution', cardinality: 100 }, // ~6.6 bits
  { name: 'Timezone', cardinality: 200 }, // ~7.6 bits
  { name: 'Language', cardinality: 50 }, // ~5.6 bits
  { name: 'Canvas Hash', cardinality: 100000 }, // ~16.6 bits
  { name: 'WebGL Renderer', cardinality: 5000 }, // ~12.3 bits
  { name: 'Audio Fingerprint', cardinality: 10000 }, // ~13.3 bits
  { name: 'Fonts', cardinality: 50000 }, // ~15.6 bits
  { name: 'Hardware Concurrency', cardinality: 16 }, // ~4 bits
  { name: 'Device Memory', cardinality: 8 }, // ~3 bits
  { name: 'Color Depth', cardinality: 4 }, // ~2 bits
];

/**
 * Calculate theoretical total entropy
 */
export function getTheoreticalTotalEntropy(): number {
  return calculateTotalEntropy(THEORETICAL_ENTROPY);
}

/**
 * Format entropy as human-readable string
 */
export function formatEntropy(entropyBits: number): string {
  const uniqueness = estimateUniqueness(entropyBits);

  if (uniqueness < 1000) {
    return `1 in ${Math.round(uniqueness)}`;
  } else if (uniqueness < 1000000) {
    return `1 in ${(uniqueness / 1000).toFixed(1)}K`;
  } else if (uniqueness < 1000000000) {
    return `1 in ${(uniqueness / 1000000).toFixed(1)}M`;
  } else if (uniqueness < 1000000000000) {
    return `1 in ${(uniqueness / 1000000000).toFixed(1)}B`;
  } else {
    return `1 in ${uniqueness.toExponential(2)}`;
  }
}

/**
 * Calculate observed entropy from real fingerprint data
 */
export function calculateObservedEntropy(
  fingerprintCounts: Map<string, number>
): number {
  const total = Array.from(fingerprintCounts.values()).reduce((sum, count) => sum + count, 0);

  if (total === 0) return 0;

  const probabilities = Array.from(fingerprintCounts.values()).map(count => count / total);

  return -probabilities.reduce((sum, p) => {
    return p > 0 ? sum + p * Math.log2(p) : sum;
  }, 0);
}

/**
 * Analyze fingerprint attribute distribution
 */
export interface AttributeDistribution {
  attribute: string;
  uniqueValues: number;
  entropy: number;
  topValues: Array<{ value: string; count: number; percentage: number }>;
}

export function analyzeAttributeDistribution(
  attributeName: string,
  values: string[]
): AttributeDistribution {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  const total = values.length;
  const probabilities = Array.from(counts.values()).map(count => count / total);

  const entropy = -probabilities.reduce((sum, p) => {
    return p > 0 ? sum + p * Math.log2(p) : sum;
  }, 0);

  // Get top 10 most common values
  const topValues = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / total) * 100,
    }));

  return {
    attribute: attributeName,
    uniqueValues: counts.size,
    entropy,
    topValues,
  };
}

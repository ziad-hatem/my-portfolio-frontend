// Advanced fingerprint matching algorithms

import type {
  FingerprintData,
  WeightedAttribute,
  FingerprintRecord,
} from './fingerprint-types';

// Weighted attributes for similarity calculation
export const FINGERPRINT_WEIGHTS: WeightedAttribute[] = [
  {
    key: 'canvasHash',
    weight: 0.25, // 25% of total score
    compareFn: (a: string, b: string) => (a === b ? 1 : 0),
  },
  {
    key: 'webgl.unmaskedRenderer',
    weight: 0.20,
    compareFn: (a: string, b: string) => (a === b ? 1 : 0),
  },
  {
    key: 'audio.sum',
    weight: 0.15,
    compareFn: (a: string, b: string) => (a === b ? 1 : 0),
  },
  {
    key: 'fonts',
    weight: 0.15,
    compareFn: (a: string[], b: string[]) => {
      if (!a || !b || !Array.isArray(a) || !Array.isArray(b)) return 0;

      const set1 = new Set(a);
      const set2 = new Set(b);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    },
  },
  {
    key: 'basic.screen',
    weight: 0.10,
    compareFn: (a: any, b: any) => {
      if (!a || !b) return 0;
      return a.width === b.width && a.height === b.height ? 1 : 0;
    },
  },
  {
    key: 'basic.timezone.timezone',
    weight: 0.08,
    compareFn: (a: string, b: string) => (a === b ? 1 : 0),
  },
  {
    key: 'basic.hardwareConcurrency',
    weight: 0.07,
    compareFn: (a: number, b: number) => (a === b ? 1 : 0),
  },
];

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

/**
 * Calculate weighted similarity between two fingerprints
 * Returns a score between 0 and 1
 */
export function calculateWeightedSimilarity(
  fp1: FingerprintData,
  fp2: FingerprintData | any
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const attr of FINGERPRINT_WEIGHTS) {
    const val1 = getNestedValue(fp1, attr.key);
    const val2 = getNestedValue(fp2, attr.key);

    if (val1 !== undefined && val2 !== undefined) {
      const similarity = attr.compareFn(val1, val2);
      totalScore += similarity * attr.weight;
      totalWeight += attr.weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Simple similarity calculation (for basic matching)
 */
export function calculateSimpleSimilarity(
  fp1: FingerprintData,
  fp2: FingerprintData | any
): number {
  let matches = 0;
  let total = 0;

  // Canvas hash
  total++;
  if (fp1.canvasHash && fp2.canvasHash && fp1.canvasHash === fp2.canvasHash) {
    matches++;
  }

  // WebGL renderer
  total++;
  if (
    fp1.webgl?.unmaskedRenderer &&
    fp2.webgl?.unmaskedRenderer &&
    fp1.webgl.unmaskedRenderer === fp2.webgl.unmaskedRenderer
  ) {
    matches++;
  }

  // Audio
  total++;
  if (fp1.audio?.sum && fp2.audio?.sum && fp1.audio.sum === fp2.audio.sum) {
    matches++;
  }

  // Screen resolution
  total++;
  if (
    fp1.basic.screen.width === fp2.basic?.screen?.width &&
    fp1.basic.screen.height === fp2.basic?.screen?.height
  ) {
    matches++;
  }

  // Fonts (Jaccard similarity)
  if (fp1.fonts && fp2.fonts && Array.isArray(fp1.fonts) && Array.isArray(fp2.fonts)) {
    total++;
    const set1 = new Set(fp1.fonts);
    const set2 = new Set(fp2.fonts);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    matches += jaccardSimilarity;
  }

  // Timezone
  total++;
  if (
    fp1.basic.timezone.timezone === fp2.basic?.timezone?.timezone
  ) {
    matches++;
  }

  return total > 0 ? matches / total : 0;
}

/**
 * Find best matching fingerprint from a set of existing fingerprints
 */
export function findBestMatch(
  targetFingerprint: FingerprintData,
  existingFingerprints: FingerprintRecord[],
  threshold: number = 0.85
): { match: FingerprintRecord; similarity: number } | null {
  let bestMatch: FingerprintRecord | null = null;
  let bestSimilarity = 0;

  for (const existing of existingFingerprints) {
    const similarity = calculateWeightedSimilarity(
      targetFingerprint,
      existing.data
    );

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = existing;
    }
  }

  if (bestMatch && bestSimilarity >= threshold) {
    return { match: bestMatch, similarity: bestSimilarity };
  }

  return null;
}

/**
 * Detect inconsistencies in fingerprint data (possible spoofing)
 */
export function detectInconsistencies(fp: FingerprintData): string[] {
  const issues: string[] = [];

  const ua = fp.basic.userAgent.toLowerCase();
  const platform = fp.basic.platform.toLowerCase();

  // Check User-Agent vs Platform consistency
  if (ua.includes('windows') && !platform.includes('win')) {
    issues.push('UA/Platform mismatch: Windows UA but non-Windows platform');
  }

  if (ua.includes('mac') && !platform.includes('mac')) {
    issues.push('UA/Platform mismatch: Mac UA but non-Mac platform');
  }

  if (ua.includes('linux') && !platform.includes('linux')) {
    issues.push('UA/Platform mismatch: Linux UA but non-Linux platform');
  }

  // Check screen resolution vs window size
  if (fp.basic.screen.width < fp.basic.window.innerWidth) {
    issues.push('Screen width < window width (impossible)');
  }

  if (fp.basic.screen.height < fp.basic.window.innerHeight) {
    issues.push('Screen height < window height (impossible)');
  }

  // Check WebGL vendor consistency
  if (fp.webgl?.unmaskedVendor && fp.webgl?.unmaskedRenderer) {
    const vendor = fp.webgl.unmaskedVendor.toLowerCase();
    const renderer = fp.webgl.unmaskedRenderer.toLowerCase();

    if (vendor.includes('nvidia') && !renderer.includes('nvidia')) {
      issues.push('WebGL vendor mismatch: NVIDIA vendor but non-NVIDIA renderer');
    }

    if (vendor.includes('amd') && !renderer.includes('amd') && !renderer.includes('radeon')) {
      issues.push('WebGL vendor mismatch: AMD vendor but non-AMD renderer');
    }

    if (vendor.includes('intel') && !renderer.includes('intel')) {
      issues.push('WebGL vendor mismatch: Intel vendor but non-Intel renderer');
    }
  }

  // Check for unrealistic hardware concurrency
  if (fp.basic.hardwareConcurrency && fp.basic.hardwareConcurrency > 128) {
    issues.push('Unrealistic CPU core count (>128)');
  }

  // Check for headless browser patterns
  if (
    fp.webgl?.renderer?.includes('SwiftShader') ||
    fp.webgl?.renderer?.includes('llvmpipe')
  ) {
    issues.push('Possible headless browser (software renderer)');
  }

  // Check for automation indicators
  if (ua.includes('headlesschrome') || ua.includes('phantomjs')) {
    issues.push('Automation tool detected in User-Agent');
  }

  // Check timezone vs language (basic check)
  const tz = fp.basic.timezone.timezone || '';
  const lang = fp.basic.language || '';

  // Example: en-US typically in Americas
  if (lang.startsWith('en-US') && tz.startsWith('Asia/') && !tz.includes('Manila')) {
    issues.push('Possible timezone/language mismatch');
  }

  return issues;
}

/**
 * Calculate bot score (0 = human, 100 = bot)
 */
export function calculateBotScore(fp: FingerprintData): number {
  let score = 0;

  // Check for headless browser signatures
  if (fp.webgl?.renderer?.includes('SwiftShader')) score += 30;
  if (fp.webgl?.renderer?.includes('llvmpipe')) score += 30;

  // Check for automation tools in User-Agent
  const ua = fp.basic.userAgent.toLowerCase();
  if (ua.includes('headlesschrome')) score += 50;
  if (ua.includes('phantomjs')) score += 50;
  if (ua.includes('selenium')) score += 40;

  // Check for missing features (bots often don't implement everything)
  if (!fp.audio) score += 10;
  if (!fp.webgl) score += 15;
  if (!fp.canvasHash) score += 10;

  // Check for impossible values
  if (fp.basic.hardwareConcurrency && fp.basic.hardwareConcurrency > 64) score += 20;
  if (fp.basic.screen.colorDepth > 32) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate age-adjusted confidence (fingerprints become less reliable over time)
 */
export function calculateAgeAdjustedConfidence(
  baseConfidence: number,
  fingerprintAgeInDays: number
): number {
  const HALF_LIFE_DAYS = 30; // Confidence halves every 30 days
  const decayFactor = Math.pow(0.5, fingerprintAgeInDays / HALF_LIFE_DAYS);
  return baseConfidence * decayFactor;
}

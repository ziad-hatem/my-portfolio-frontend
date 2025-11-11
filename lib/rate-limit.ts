// Rate limiting utility for API endpoints

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens to track
}

// In-memory cache for rate limiting
// For production, consider using Redis or a distributed cache
const tokenCache = new Map<string, number[]>();

export function rateLimit(config: RateLimitConfig) {
  const { interval, uniqueTokenPerInterval } = config;

  return {
    check: async (identifier: string, limit: number): Promise<void> => {
      const now = Date.now();
      const timestamps = tokenCache.get(identifier) || [];

      // Remove timestamps outside the current interval
      const validTimestamps = timestamps.filter(t => now - t < interval);

      if (validTimestamps.length >= limit) {
        throw new Error('Rate limit exceeded');
      }

      // Add current timestamp
      validTimestamps.push(now);
      tokenCache.set(identifier, validTimestamps);

      // Cleanup: Remove oldest entries if cache is too large
      if (tokenCache.size > uniqueTokenPerInterval) {
        const oldestKey = tokenCache.keys().next().value;
        if (oldestKey) {
          tokenCache.delete(oldestKey);
        }
      }
    },

    // Get remaining requests for an identifier
    getRemaining: (identifier: string, limit: number): number => {
      const now = Date.now();
      const timestamps = tokenCache.get(identifier) || [];
      const validTimestamps = timestamps.filter(t => now - t < interval);
      return Math.max(0, limit - validTimestamps.length);
    },

    // Reset rate limit for an identifier
    reset: (identifier: string): void => {
      tokenCache.delete(identifier);
    },
  };
}

// Pre-configured rate limiters
export const fingerprintRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const analyticsRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

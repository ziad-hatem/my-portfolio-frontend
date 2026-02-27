import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique ids kept in memory fallback
  prefix?: string;
}

interface RateLimiter {
  check(identifier: string, limit: number): Promise<void>;
  getRemaining(identifier: string, limit: number): Promise<number>;
  reset(identifier: string): Promise<void>;
}

const inMemoryTokenCache = new Map<string, number[]>();
let cachedRedisClient: Redis | null | undefined;

function getIntervalSeconds(intervalMs: number): number {
  return Math.max(1, Math.ceil(intervalMs / 1000));
}

function sanitizeIdentifier(identifier: string): string {
  return encodeURIComponent(identifier || "anonymous");
}

function buildWindowId(intervalMs: number): number {
  return Math.floor(Date.now() / intervalMs);
}

function buildRedisKey(prefix: string, intervalMs: number, identifier: string): string {
  return `${prefix}:${intervalMs}:${buildWindowId(intervalMs)}:${sanitizeIdentifier(identifier)}`;
}

function createInMemoryLimiter(config: RateLimitConfig): RateLimiter {
  const { interval, uniqueTokenPerInterval } = config;

  return {
    async check(identifier: string, limit: number): Promise<void> {
      const now = Date.now();
      const timestamps = inMemoryTokenCache.get(identifier) || [];
      const validTimestamps = timestamps.filter((time) => now - time < interval);

      if (validTimestamps.length >= limit) {
        throw new Error("Rate limit exceeded");
      }

      validTimestamps.push(now);
      inMemoryTokenCache.set(identifier, validTimestamps);

      if (inMemoryTokenCache.size > uniqueTokenPerInterval) {
        const oldestKey = inMemoryTokenCache.keys().next().value;
        if (oldestKey) {
          inMemoryTokenCache.delete(oldestKey);
        }
      }
    },

    async getRemaining(identifier: string, limit: number): Promise<number> {
      const now = Date.now();
      const timestamps = inMemoryTokenCache.get(identifier) || [];
      const validTimestamps = timestamps.filter((time) => now - time < interval);
      return Math.max(0, limit - validTimestamps.length);
    },

    async reset(identifier: string): Promise<void> {
      inMemoryTokenCache.delete(identifier);
    },
  };
}

function getRedisClient(): Redis | null {
  if (cachedRedisClient !== undefined) {
    return cachedRedisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cachedRedisClient = null;
    return cachedRedisClient;
  }

  cachedRedisClient = new Redis({
    url,
    token,
  });

  return cachedRedisClient;
}

function parseRedisCounter(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function createRedisLimiter(config: RateLimitConfig, redis: Redis): RateLimiter {
  const { interval } = config;
  const prefix =
    config.prefix || process.env.RATE_LIMIT_PREFIX || "portfolio:rate-limit";
  const intervalSeconds = getIntervalSeconds(interval);

  return {
    async check(identifier: string, limit: number): Promise<void> {
      const key = buildRedisKey(prefix, interval, identifier);
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, intervalSeconds);
      }

      if (count > limit) {
        throw new Error("Rate limit exceeded");
      }
    },

    async getRemaining(identifier: string, limit: number): Promise<number> {
      const key = buildRedisKey(prefix, interval, identifier);
      const count = parseRedisCounter(await redis.get(key));
      return Math.max(0, limit - count);
    },

    async reset(identifier: string): Promise<void> {
      const key = buildRedisKey(prefix, interval, identifier);
      await redis.del(key);
    },
  };
}

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const redis = getRedisClient();
  if (redis) {
    return createRedisLimiter(config, redis);
  }

  return createInMemoryLimiter(config);
}

// Optional default limiter for small public forms/endpoints.
export const defaultPublicRateLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

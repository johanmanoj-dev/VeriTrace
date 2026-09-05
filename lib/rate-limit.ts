// lib/rate-limit.ts
// Sliding window rate limiter per authenticated user and endpoint

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number; limit: number }
  | { allowed: false; retryAfter: number; resetAt: number; limit: number };

interface WindowEntry {
  count: number;
  windowStart: number;
}

// In-memory store per user+key
const store = new Map<string, WindowEntry>();

// Route policy presets
export const RATE_LIMITS = {
  verifyBurst: { maxRequests: 5, windowMs: 10 * 60 * 1000 }, // 5 req / 10 min
  verifyHourly: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 req / 1 hour
  reportsList: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req / 1 min
  reportDetail: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 req / 1 min
  reportDelete: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req / 1 min
} as const;

/**
 * Checks sliding window rate limit for a given user and endpoint key.
 */
export function checkRateLimit(userId: string, key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const compositeKey = `${userId}:${key}`;
  const entry = store.get(compositeKey);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    store.set(compositeKey, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Math.ceil((now + config.windowMs) / 1000),
      limit: config.maxRequests,
    };
  }

  if (entry.count < config.maxRequests) {
    entry.count += 1;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: Math.ceil((entry.windowStart + config.windowMs) / 1000),
      limit: config.maxRequests,
    };
  }

  const resetAt = Math.ceil((entry.windowStart + config.windowMs) / 1000);
  const retryAfter = Math.max(1, Math.ceil((entry.windowStart + config.windowMs - now) / 1000));

  return {
    allowed: false,
    retryAfter,
    resetAt,
    limit: config.maxRequests,
  };
}

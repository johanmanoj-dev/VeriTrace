// tests/unit/rate-limit.test.ts
// Unit tests for lib/rate-limit.ts sliding window rate limiter
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

const TEST_CONFIG = { maxRequests: 3, windowMs: 60_000 };

describe("lib/rate-limit -- checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request and returns remaining = maxRequests - 1", () => {
    const result = checkRateLimit("user-rl-1", "test-key-a", TEST_CONFIG);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(3);
    }
  });

  it("allows up to maxRequests within the window", () => {
    const key = "test-key-b";
    checkRateLimit("user-rl-2", key, TEST_CONFIG);
    checkRateLimit("user-rl-2", key, TEST_CONFIG);
    const third = checkRateLimit("user-rl-2", key, TEST_CONFIG);
    expect(third.allowed).toBe(true);
  });

  it("blocks when maxRequests is exceeded within window", () => {
    const key = "test-key-c";
    checkRateLimit("user-rl-3", key, TEST_CONFIG);
    checkRateLimit("user-rl-3", key, TEST_CONFIG);
    checkRateLimit("user-rl-3", key, TEST_CONFIG);
    const fourth = checkRateLimit("user-rl-3", key, TEST_CONFIG);
    expect(fourth.allowed).toBe(false);
    if (!fourth.allowed) {
      expect(fourth.retryAfter).toBeGreaterThan(0);
      expect(fourth.limit).toBe(3);
    }
  });

  it("resets window after windowMs elapses", () => {
    const key = "test-key-d";
    checkRateLimit("user-rl-4", key, TEST_CONFIG);
    checkRateLimit("user-rl-4", key, TEST_CONFIG);
    checkRateLimit("user-rl-4", key, TEST_CONFIG);
    vi.advanceTimersByTime(TEST_CONFIG.windowMs + 1);
    const after = checkRateLimit("user-rl-4", key, TEST_CONFIG);
    expect(after.allowed).toBe(true);
    if (after.allowed) {
      expect(after.remaining).toBe(2);
    }
  });

  it("isolates by userId", () => {
    const key = "test-key-e";
    checkRateLimit("user-rl-5", key, TEST_CONFIG);
    checkRateLimit("user-rl-5", key, TEST_CONFIG);
    checkRateLimit("user-rl-5", key, TEST_CONFIG);
    expect(checkRateLimit("user-rl-5", key, TEST_CONFIG).allowed).toBe(false);
    expect(checkRateLimit("user-rl-6", key, TEST_CONFIG).allowed).toBe(true);
  });

  it("isolates by key (same user, different endpoints)", () => {
    checkRateLimit("user-rl-7", "key-A", TEST_CONFIG);
    checkRateLimit("user-rl-7", "key-A", TEST_CONFIG);
    checkRateLimit("user-rl-7", "key-A", TEST_CONFIG);
    expect(checkRateLimit("user-rl-7", "key-A", TEST_CONFIG).allowed).toBe(false);
    expect(checkRateLimit("user-rl-7", "key-B", TEST_CONFIG).allowed).toBe(true);
  });

  it("429 blocked result includes positive retryAfter and future resetAt", () => {
    const key = "test-key-f";
    checkRateLimit("user-rl-8", key, TEST_CONFIG);
    checkRateLimit("user-rl-8", key, TEST_CONFIG);
    checkRateLimit("user-rl-8", key, TEST_CONFIG);
    vi.advanceTimersByTime(10_000);
    const blocked = checkRateLimit("user-rl-8", key, TEST_CONFIG);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    }
  });
});

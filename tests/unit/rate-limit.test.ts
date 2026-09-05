import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("lib/rate-limit", () => {
  it("allows requests under the limit", () => {
    const userId = "test-user-1";
    const config = { maxRequests: 3, windowMs: 10000 };

    const first = checkRateLimit(userId, "test", config);
    expect(first.allowed).toBe(true);
    if (first.allowed) {
      expect(first.remaining).toBe(2);
      expect(first.limit).toBe(3);
    }

    const second = checkRateLimit(userId, "test", config);
    expect(second.allowed).toBe(true);
    if (second.allowed) {
      expect(second.remaining).toBe(1);
    }

    const third = checkRateLimit(userId, "test", config);
    expect(third.allowed).toBe(true);
    if (third.allowed) {
      expect(third.remaining).toBe(0);
    }
  });

  it("blocks requests that exceed the limit", () => {
    const userId = "test-user-2";
    const config = { maxRequests: 2, windowMs: 5000 };

    checkRateLimit(userId, "test2", config);
    checkRateLimit(userId, "test2", config);

    const third = checkRateLimit(userId, "test2", config);
    expect(third.allowed).toBe(false);
    if (!third.allowed) {
      expect(third.retryAfter).toBeGreaterThan(0);
      expect(third.limit).toBe(2);
    }
  });

  it("isolates different users", () => {
    const config = { maxRequests: 1, windowMs: 5000 };

    const userA = checkRateLimit("user-a", "isolate", config);
    expect(userA.allowed).toBe(true);

    const userB = checkRateLimit("user-b", "isolate", config);
    expect(userB.allowed).toBe(true);

    const userABlocked = checkRateLimit("user-a", "isolate", config);
    expect(userABlocked.allowed).toBe(false);
  });
});

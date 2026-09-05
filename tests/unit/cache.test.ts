// tests/unit/cache.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Firebase Admin ──────────────────────────────────────────────────
const { mockGet, mockSet, mockDoc, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDoc = vi.fn(() => ({
    get: mockGet,
    set: mockSet,
  }));
  const mockCollection = vi.fn(() => ({
    doc: mockDoc,
  }));
  return { mockGet, mockSet, mockDoc, mockCollection };
});

vi.mock("@/firebase/admin", () => ({
  adminDb: {
    collection: mockCollection,
  },
}));

import { computeHash, getCachedReportId, setCachedReportId } from "@/lib/cache";

describe("lib/cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeHash", () => {
    it("computes deterministic SHA-256 hash for buffer", () => {
      const buffer = Buffer.from("test image content");
      const hash1 = computeHash(buffer);
      const hash2 = computeHash(buffer);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits = 64 hex chars
    });

    it("produces distinct hashes for different input data", () => {
      const hashA = computeHash(Buffer.from("media A"));
      const hashB = computeHash(Buffer.from("media B"));

      expect(hashA).not.toBe(hashB);
    });

    it("handles Uint8Array input correctly", () => {
      const uint8 = new Uint8Array([1, 2, 3, 4, 5]);
      const hash = computeHash(uint8);

      expect(hash).toHaveLength(64);
    });
  });

  describe("getCachedReportId", () => {
    it("returns reportId on cache hit", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ reportId: "report-abc-123" }),
      });

      const result = await getCachedReportId("hash123");

      expect(mockCollection).toHaveBeenCalledWith("cache");
      expect(mockDoc).toHaveBeenCalledWith("hash123");
      expect(result).toBe("report-abc-123");
    });

    it("returns null on cache miss (doc does not exist)", async () => {
      mockGet.mockResolvedValueOnce({
        exists: false,
        data: () => undefined,
      });

      const result = await getCachedReportId("missing-hash");

      expect(result).toBeNull();
    });

    it("returns null if doc exists but reportId is missing", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({}),
      });

      const result = await getCachedReportId("empty-doc-hash");

      expect(result).toBeNull();
    });
  });

  describe("setCachedReportId", () => {
    it("writes hash and reportId with timestamp to Firestore cache collection", async () => {
      mockSet.mockResolvedValueOnce(undefined);

      await setCachedReportId("hash-xyz", "report-999");

      expect(mockCollection).toHaveBeenCalledWith("cache");
      expect(mockDoc).toHaveBeenCalledWith("hash-xyz");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: "report-999",
          createdAt: expect.any(String),
        })
      );
    });
  });
});

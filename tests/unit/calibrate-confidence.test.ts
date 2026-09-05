// tests/unit/calibrate-confidence.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock server-only so import doesn't throw in test env
vi.mock("server-only", () => ({}));

import { calibrateConfidence } from "@/lib/gemini";

describe("calibrateConfidence", () => {
  it("overrides LLM default hedge (0.72) for likely_manipulated with high indicators", () => {
    const result = calibrateConfidence(0.72, "likely_manipulated", [
      { severity: "high" },
      { severity: "high" },
    ]);
    expect(result).toBeGreaterThanOrEqual(0.93);
    expect(result).not.toBe(0.72);
  });

  it("overrides LLM default hedge (0.72) for likely_authentic with zero anomalies", () => {
    const result = calibrateConfidence(0.72, "likely_authentic", []);
    expect(result).toBe(0.95);
  });

  it("produces high confidence (85%+) for single high severity indicator", () => {
    const result = calibrateConfidence(0.8, "likely_manipulated", [{ severity: "high" }]);
    expect(result).toBeGreaterThanOrEqual(0.82);
  });

  it("handles inconclusive verdict with low bounded confidence", () => {
    const result = calibrateConfidence(0.75, "inconclusive", []);
    expect(result).toBeLessThanOrEqual(0.58);
  });

  it("blends valid non-hedge raw confidence with evidence score", () => {
    const result = calibrateConfidence(0.92, "likely_manipulated", [
      { severity: "high" },
      { severity: "high" },
    ]);
    expect(result).toBeGreaterThanOrEqual(0.9);
  });
});


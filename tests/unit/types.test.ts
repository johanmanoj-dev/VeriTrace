// tests/unit/types.test.ts
import { describe, it, expect } from "vitest";
import { IndicatorSchema, AnalysisResultSchema, GroundingResultSchema } from "@/lib/gemini";

describe("lib/types and Zod Schemas", () => {
  describe("IndicatorSchema", () => {
    it("validates a valid indicator", () => {
      const valid = {
        type: "facial_inconsistency",
        severity: "high",
        explanation: "Mismatched eye reflections and warping around jawline",
        evidenceRegion: { x: 100, y: 150, width: 80, height: 80, label: "Face" },
      };

      const result = IndicatorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts an indicator without optional evidenceRegion", () => {
      const valid = {
        type: "spectral_cut",
        severity: "medium",
        explanation: "Abrupt drop in audio frequency at 0:14",
      };

      const result = IndicatorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid severity values", () => {
      const invalid = {
        type: "noise",
        severity: "critical", // Invalid: must be low, medium, high
        explanation: "High noise",
      };

      const result = IndicatorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty type or explanation", () => {
      const invalid = {
        type: "",
        severity: "low",
        explanation: "",
      };

      const result = IndicatorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("AnalysisResultSchema", () => {
    it("validates a complete Gemini analysis result", () => {
      const valid = {
        title: "Photorealistic deepfake assessment",
        assessment: "likely_manipulated",
        confidence: 0.94,
        explanation: "Multiple visual and lighting inconsistencies detected.",
        indicators: [
          {
            type: "lighting_mismatch",
            severity: "high",
            explanation: "Subject lighting opposes background light direction.",
          },
        ],
        claims: ["Depicts a recent rally in Paris"],
      };

      const result = AnalysisResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assessment).toBe("likely_manipulated");
        expect(result.data.confidence).toBe(0.94);
        expect(result.data.indicators).toHaveLength(1);
      }
    });

    it("rejects confidence scores outside 0.0 - 1.0", () => {
      const invalid = {
        title: "Test",
        assessment: "likely_authentic",
        confidence: 1.5, // invalid
        explanation: "Test",
        indicators: [],
        claims: [],
      };

      const result = AnalysisResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid assessment verdicts", () => {
      const invalid = {
        title: "Test",
        assessment: "definitely_real", // invalid
        confidence: 0.8,
        explanation: "Test",
        indicators: [],
        claims: [],
      };

      const result = AnalysisResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("GroundingResultSchema", () => {
    it("validates valid search grounding results", () => {
      const valid = {
        contextVerdict: "corroborated",
        contextEvidence: ["Official statement released on 2026-09-01"],
        groundingSources: [
          {
            title: "News Agency Report",
            url: "https://example.com/news",
            snippet: "Confirmed event took place.",
            credibility: "high",
          },
        ],
      };

      const result = GroundingResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contextVerdict).toBe("corroborated");
        expect(result.data.groundingSources).toHaveLength(1);
      }
    });

    it("defaults empty arrays for sources and evidence if omitted", () => {
      const minimal = {
        contextVerdict: "insufficient_data",
      };

      const result = GroundingResultSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contextEvidence).toEqual([]);
        expect(result.data.groundingSources).toEqual([]);
      }
    });
  });
});

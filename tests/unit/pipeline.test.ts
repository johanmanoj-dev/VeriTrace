// tests/unit/pipeline.test.ts
// Unit tests for lib/pipeline.ts with all external dependencies mocked
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
// Mock server-only so it doesn't throw in jsdom test env
vi.mock("server-only", () => ({}));

vi.mock("@/firebase/admin", () => ({
  adminDb: {},
  adminAuth: {},
}));

vi.mock("@/lib/cache", () => ({
  computeHash: vi.fn(() => "abc123hash"),
  getCachedReportId: vi.fn(async () => null), // cache miss by default
  setCachedReportId: vi.fn(async () => undefined),
}));

vi.mock("@/lib/firestore", () => ({
  createReport: vi.fn(async () => "report-id-001"),
  getReport: vi.fn(async (id: string) => ({
    id,
    userId: "user-1",
    title: "Mocked report",
    mediaType: "image",
    assessment: "likely_manipulated",
    confidence: 0.87,
    assessmentDescription: "Mocked analysis explanation",
    indicators: [
      { type: "Facial geometry", severity: "high", explanation: "Inconsistent proportions" },
    ],
    claims: ["This image shows flooding in Mumbai"],
    contextVerdict: "partially_verified",
    contextEvidence: ["Event was reported"],
    groundingSources: [],
    createdAt: new Date().toISOString(),
  })),
}));

vi.mock("@/lib/gemini", () => ({
  analyzeMedia: vi.fn(async () => ({
    title: "Mocked report",
    assessment: "likely_manipulated",
    confidence: 0.87,
    explanation: "Mocked analysis explanation",
    indicators: [
      { type: "Facial geometry", severity: "high", explanation: "Inconsistent proportions" },
    ],
    claims: ["This image shows flooding in Mumbai"],
  })),
  analyzeWithGrounding: vi.fn(async () => ({
    contextVerdict: "partially_verified",
    contextEvidence: ["Event was reported by multiple sources"],
    groundingSources: [],
  })),
  uploadToFileApi: vi.fn(async () => "files/mock-file-uri"),
}));

vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  return {
    ...actual,
    validateMagicBytes: vi.fn(() => ({ valid: true, detectedMime: "image/jpeg" })),
  };
});

// ── Import after mocks ─────────────────────────────────────────────────────
import { runPipeline } from "@/lib/pipeline";
import { getCachedReportId, setCachedReportId } from "@/lib/cache";
import { createReport, getReport } from "@/lib/firestore";
import { analyzeMedia, analyzeWithGrounding } from "@/lib/gemini";

// ── Helpers ────────────────────────────────────────────────────────────────
function makeFakeFile(name = "test.jpg", size = 1024): File {
  const blob = new Blob([new Uint8Array(size).fill(0xff)], { type: "image/jpeg" });
  return new File([blob], name, { type: "image/jpeg" });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("lib/pipeline — runPipeline (file)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: cache miss
    vi.mocked(getCachedReportId).mockResolvedValue(null);
  });

  it("calls analyzeMedia and saves report on cache miss", async () => {
    const file = makeFakeFile();
    const report = await runPipeline({ kind: "file", file, userId: "user-1" });

    expect(analyzeMedia).toHaveBeenCalledOnce();
    expect(createReport).toHaveBeenCalledOnce();
    expect(setCachedReportId).toHaveBeenCalledWith("abc123hash", "report-id-001");
    expect(report.id).toBe("report-id-001");
    expect(report.assessment).toBe("likely_manipulated");
  });

  it("calls analyzeWithGrounding when claims > 0", async () => {
    const file = makeFakeFile();
    await runPipeline({ kind: "file", file, userId: "user-1" });

    expect(analyzeWithGrounding).toHaveBeenCalledOnce();
    expect(analyzeWithGrounding).toHaveBeenCalledWith(["This image shows flooding in Mumbai"]);
  });

  it("skips analyzeMedia and returns cached report on cache hit", async () => {
    vi.mocked(getCachedReportId).mockResolvedValue("cached-report-id");
    vi.mocked(getReport).mockResolvedValue({
      id: "cached-report-id",
      userId: "user-1",
      title: "Cached",
      mediaType: "image",
      assessment: "likely_authentic",
      confidence: 0.91,
      assessmentDescription: "Cached report",
      indicators: [],
      claims: [],
      contextVerdict: "corroborated",
      contextEvidence: [],
      groundingSources: [],
      createdAt: new Date().toISOString(),
    });

    const file = makeFakeFile();
    const report = await runPipeline({ kind: "file", file, userId: "user-1" });

    expect(analyzeMedia).not.toHaveBeenCalled();
    expect(createReport).not.toHaveBeenCalled();
    expect(report.id).toBe("cached-report-id");
    expect(report.assessment).toBe("likely_authentic");
  });

  it("does not call analyzeWithGrounding when no claims", async () => {
    vi.mocked(analyzeMedia).mockResolvedValue({
      title: "No claims report",
      assessment: "likely_authentic",
      confidence: 0.95,
      explanation: "Looks clean",
      indicators: [],
      claims: [], // empty
    });

    const file = makeFakeFile();
    await runPipeline({ kind: "file", file, userId: "user-1" });

    expect(analyzeWithGrounding).not.toHaveBeenCalled();
  });

  it("throws PipelineError on invalid magic bytes", async () => {
    const { validateMagicBytes } = await import("@/lib/validation");
    vi.mocked(validateMagicBytes).mockReturnValueOnce({ valid: false });

    const { PipelineError } = await import("@/lib/pipeline");
    const file = makeFakeFile("malicious.txt");

    await expect(runPipeline({ kind: "file", file, userId: "user-1" })).rejects.toThrow(PipelineError);
  });
});

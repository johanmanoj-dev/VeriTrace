// lib/pipeline.ts — SERVER ONLY
// Orchestrates the full Detect → Explain → Verify → Trace pipeline.
// Pipeline order (must not change):
// 1. Auth → 2. Validate → 3. Cache lookup → 4. Prepare media → 5. Gemini analysis
// → 6. Grounding (if claims > 0) → 7. Build report → 8. Save → 9. Return
import "server-only";
import { computeHash, getCachedReportId, setCachedReportId } from "@/lib/cache";
import { createReport, getReport } from "@/lib/firestore";
import { analyzeMedia, analyzeWithGrounding, uploadToFileApi, analyzeUrl } from "@/lib/gemini";
import { validateMagicBytes } from "@/lib/validation";
import type { VerificationReport, MediaType } from "@/lib/types";

export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export type PipelineInput =
  | { kind: "file"; file: File; userId: string; previewUrl?: string }
  | { kind: "url"; url: string; userId: string };

// Max inline base64 size — 15 MB images stay inline, larger audio/video go to File API
const INLINE_SIZE_LIMIT = 15 * 1024 * 1024;

/**
 * Runs the full verification pipeline for a file upload.
 */
async function runFilePipeline(file: File, userId: string, previewUrl?: string): Promise<VerificationReport> {
  // — Step 2: Validate magic bytes
  const headerBuffer = await file.slice(0, 32).arrayBuffer();
  const magic = validateMagicBytes(new Uint8Array(headerBuffer));

  if (!magic.valid || !magic.detectedMime) {
    throw new PipelineError("Invalid or unsupported media format", 400);
  }

  const mimeType = magic.detectedMime;
  const isVideo = mimeType.startsWith("video/");
  const isAudio = mimeType.startsWith("audio/");
  const mediaType: "image" | "audio" | "video" = isVideo ? "video" : isAudio ? "audio" : "image";

  // — Step 3: Cache lookup via SHA-256
  const fileBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(fileBuffer);
  const hash = computeHash(bytes);

  const cachedReportId = await getCachedReportId(hash);
  if (cachedReportId) {
    const cached = await getReport(cachedReportId);
    // Return cached report if it exists and belongs to any user (public dedup)
    if (cached) return cached;
  }

  // — Step 4: Prepare media payload for Gemini
  let payload: Parameters<typeof analyzeMedia>[0];
  let geminiFileUri: string | undefined;

  if (bytes.length > INLINE_SIZE_LIMIT) {
    // Large file — upload to Gemini File API (48h TTL, auto-deleted by Google)
    geminiFileUri = await uploadToFileApi(bytes, mimeType, file.name);
    payload = { type: "fileUri", uri: geminiFileUri, mimeType };
  } else {
    // Small file — send inline as base64
    const base64 = bytes.toString("base64");
    payload = { type: "inline", data: base64, mimeType };
  }

  // — Step 5: Gemini multimodal analysis (one structured call)
  let analysis: Awaited<ReturnType<typeof analyzeMedia>>;
  try {
    analysis = await analyzeMedia(payload, mediaType);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      throw new PipelineError(
        "Gemini AI rate limit reached (free tier quota). Please wait 30–60 seconds before submitting again.",
        429
      );
    }
    throw new PipelineError(`Gemini analysis failed: ${msg}`, 502);
  }

  // — Step 6: Google Search grounding (non-fatal graceful degradation)
  let grounding: {
    contextVerdict: import("@/lib/types").ContextVerdict;
    contextEvidence: string[];
    groundingSources: import("@/lib/types").GroundingSource[];
  } = {
    contextVerdict: "insufficient_data",
    contextEvidence: [],
    groundingSources: [],
  };

  if (analysis.claims.length > 0) {
    try {
      grounding = await analyzeWithGrounding(analysis.claims);
    } catch (gErr: unknown) {
      console.warn("[Grounding warning] Grounding search skipped:", gErr instanceof Error ? gErr.message : gErr);
      grounding = {
        contextVerdict: "insufficient_data" as const,
        contextEvidence: ["Grounding search quota reached or timed out; visual indicators preserved."],
        groundingSources: [],
      };
    }
  }

  // Derive fallback thumbnail if small image and no previewUrl passed
  let finalSourceUrl = previewUrl;
  if (!finalSourceUrl && mediaType === "image" && bytes.length <= 600 * 1024) {
    finalSourceUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
  }

  // — Step 7: Build report
  const reportData = {
    userId,
    title: analysis.title,
    mediaType: mediaType as MediaType,
    mediaHash: hash,
    sourceUrl: finalSourceUrl || undefined,
    mimeType,
    fileSize: file.size,
    assessment: analysis.assessment === "inconclusive" ? "inconclusive" : analysis.assessment,
    confidence: analysis.confidence,
    assessmentDescription: analysis.explanation,
    indicators: analysis.indicators,
    claims: analysis.claims,
    contextVerdict: grounding.contextVerdict,
    contextEvidence: grounding.contextEvidence,
    groundingSources: grounding.groundingSources,
    ...(geminiFileUri ? { geminiFileUri } : {}),
  } satisfies Omit<VerificationReport, "id" | "createdAt">;

  // — Step 8: Save to Firestore + update cache
  const reportId = await createReport(reportData);
  await setCachedReportId(hash, reportId);

  // — Step 9: Return full report
  const report = await getReport(reportId);
  if (!report) throw new PipelineError("Failed to retrieve saved report", 500);
  return report;
}

/**
 * Runs the full verification pipeline for a URL submission.
 */
async function runUrlPipeline(url: string, userId: string): Promise<VerificationReport> {
  // — Step 5: Gemini analysis via centralized helper in lib/gemini.ts (handles retries & model fallback)
  let analysis: import("@/lib/gemini").AnalysisResult;
  try {
    analysis = await analyzeUrl(url);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      throw new PipelineError(
        "Gemini AI rate limit reached (free tier quota). Please wait 30–60 seconds before submitting again.",
        429
      );
    }
    throw new PipelineError(`Gemini URL analysis failed: ${msg}`, 502);
  }

  // — Step 6: Grounding
  const grounding =
    analysis.claims.length > 0
      ? await analyzeWithGrounding(analysis.claims)
      : { contextVerdict: "insufficient_data" as const, contextEvidence: [] as string[], groundingSources: [] };

  // — Step 7/8: Build + save report
  const reportData = {
    userId,
    title: analysis.title,
    mediaType: "url" as MediaType,
    sourceUrl: url,
    assessment: analysis.assessment,
    confidence: analysis.confidence,
    assessmentDescription: analysis.explanation,
    indicators: analysis.indicators,
    claims: analysis.claims,
    contextVerdict: grounding.contextVerdict,
    contextEvidence: grounding.contextEvidence,
    groundingSources: grounding.groundingSources,
  } satisfies Omit<VerificationReport, "id" | "createdAt">;

  const reportId = await createReport(reportData);
  const report = await getReport(reportId);
  if (!report) throw new PipelineError("Failed to retrieve saved report", 500);
  return report;
}

/**
 * Entry point for the pipeline. Routes to file or URL sub-pipeline.
 */
export async function runPipeline(input: PipelineInput): Promise<VerificationReport> {
  if (input.kind === "file") {
    return runFilePipeline(input.file, input.userId, input.previewUrl);
  }
  return runUrlPipeline(input.url, input.userId);
}

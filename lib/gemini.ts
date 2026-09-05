import "server-only";
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerateContentResult,
  type ResponseSchema,
} from "@google/generative-ai";
import { z } from "zod";
import type { AssessmentVerdict, ContextVerdict, GroundingSource, Indicator } from "@/lib/types";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Primary model — gemini-3.6-flash (2.5-flash retired for new users)
const PRIMARY_MODEL = "gemini-3.6-flash";

// ---------------------------------------------------------------------------
// Zod schemas — validate all Gemini output before use (never trust raw shape)
// ---------------------------------------------------------------------------

const IndicatorSchema = z.object({
  type: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string().min(1),
  evidenceRegion: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

const AnalysisResultSchema = z.object({
  assessment: z.enum(["likely_authentic", "likely_manipulated", "inconclusive"]),
  confidence: z.number().min(0).max(1),
  indicators: z.array(IndicatorSchema).default([]),
  claims: z.array(z.string()).default([]),
  explanation: z.string().min(1),
  title: z.string().min(1),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const GroundingResultSchema = z.object({
  contextVerdict: z.enum(["corroborated", "partially_verified", "contradicted", "insufficient_data"]),
  contextEvidence: z.array(z.string()).default([]),
  groundingSources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().catch(""),
        snippet: z.string(),
        publisher: z.string().optional(),
        publishedDate: z.string().optional(),
        credibility: z.enum(["high", "medium", "low"]).optional(),
      })
    )
    .default([]),
});

export type GroundingResult = z.infer<typeof GroundingResultSchema>;

// ---------------------------------------------------------------------------
// Gemini responseSchema config
// EnumStringSchema requires format: "enum" in SDK v0.24.x
// ---------------------------------------------------------------------------

const ANALYSIS_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    assessment: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["likely_authentic", "likely_manipulated", "inconclusive"],
    },
    confidence: { type: SchemaType.NUMBER },
    explanation: { type: SchemaType.STRING },
    indicators: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING, format: "enum", enum: ["low", "medium", "high"] },
          explanation: { type: SchemaType.STRING },
        },
        required: ["type", "severity", "explanation"],
      },
    },
    claims: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["title", "assessment", "confidence", "explanation", "indicators", "claims"],
};


// ---------------------------------------------------------------------------
// Prompt templates — named constants; all changes must be documented here
// ---------------------------------------------------------------------------

// Updated 2026-09-05: Structured forensic analysis with strict claim extraction
// focusing on verifiable factual statements rather than opinion.
const IMAGE_ANALYSIS_PROMPT = `
You are a forensic media analyst with expertise in detecting synthetic, AI-generated, 
and digitally manipulated images. Analyze this image thoroughly and systematically.

Examine these areas in order:
1. Visual artifacts: JPEG compression anomalies, noise inconsistencies, unusual blur/sharpening
2. Anatomy and faces: geometry accuracy, eyes (pupils, reflections, lashes), teeth, ears, fingers
3. Lighting and shadows: direction consistency, soft vs hard shadows, reflection coherence
4. Object boundaries: compositing seams, cloning artifacts, edge halos
5. Text in image: font consistency, grammar, rendering quality
6. Environmental coherence: background-subject alignment, depth-of-field plausibility
7. Metadata signals: any visible timestamps, location tags, or watermarks

For each detected issue, assign severity (low / medium / high) based on impact on authenticity.

Extract any factual claims about real-world events, people, places, or dates that this image 
appears to depict — these will be verified against external sources.

Respond only with valid JSON matching the response schema.
`.trim();

// Updated 2026-09-05: Audio forensic focus on voice cloning and spectral anomalies
const AUDIO_ANALYSIS_PROMPT = `
You are a forensic audio analyst. Analyze this audio recording for signs of synthetic generation, 
voice cloning, splicing, or manipulation.

Examine:
1. Voice authenticity: naturalness of cadence, micro-pauses, breath patterns
2. Spectral anomalies: frequency gaps, unnatural smoothing (voice cloning signatures)
3. Background consistency: noise floor shifts, room echo changes mid-recording
4. Splicing artifacts: abrupt cuts, unnatural transitions, phase discontinuities
5. Emotional coherence: does the emotional tone match the content?

Respond only with valid JSON matching the response schema.
`.trim();

// Updated 2026-09-05: Video forensic focus on temporal and deepfake signals
const VIDEO_ANALYSIS_PROMPT = `
You are a forensic video analyst specializing in deepfake and manipulation detection.

Examine:
1. Face consistency across frames: texture, edge sharpness, color temperature shifts
2. Lip-sync alignment: does audio match mouth movement precisely?
3. Temporal artifacts: flickering, frame blending, unnatural motion blur
4. Eye behavior: blink rate, gaze direction plausibility
5. Background stability: compression artifacts, warping near face boundaries
6. Lighting continuity across frames

Respond only with valid JSON matching the response schema.
`.trim();

// ---------------------------------------------------------------------------
// analyzeMedia — main multimodal analysis call (ONE call per submission)
// ---------------------------------------------------------------------------

function getPromptForMediaType(mediaType: "image" | "audio" | "video"): string {
  switch (mediaType) {
    case "image":
      return IMAGE_ANALYSIS_PROMPT;
    case "audio":
      return AUDIO_ANALYSIS_PROMPT;
    case "video":
      return VIDEO_ANALYSIS_PROMPT;
  }
}

function extractJsonFromResult(result: GenerateContentResult): unknown {
  const text = result.response.text();
  // Strip markdown code fences if model wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Analyzes media inline (images) or via Gemini File API URI (audio/video).
 * Returns a validated AnalysisResult or throws with a descriptive error.
 */
export async function analyzeMedia(
  payload:
    | { type: "inline"; data: string; mimeType: string } // base64 inline
    | { type: "fileUri"; uri: string; mimeType: string }, // Gemini File API
  mediaType: "image" | "audio" | "video"
): Promise<AnalysisResult> {
  const model = genai.getGenerativeModel({
    model: PRIMARY_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_RESPONSE_SCHEMA,
    },
  });

  const prompt = getPromptForMediaType(mediaType);

  const part =
    payload.type === "inline"
      ? { inlineData: { data: payload.data, mimeType: payload.mimeType } }
      : { fileData: { fileUri: payload.uri, mimeType: payload.mimeType } };

  const result = await model.generateContent([prompt, part]);

  let raw: unknown;
  try {
    raw = extractJsonFromResult(result);
  } catch {
    throw new Error(`Gemini returned non-JSON response for ${mediaType} analysis`);
  }

  const parsed = AnalysisResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Gemini analysis response failed Zod validation: ${parsed.error.message}`);
  }

  return parsed.data;
}

// ---------------------------------------------------------------------------
// uploadToFileApi — for large audio/video using Gemini File API
// ---------------------------------------------------------------------------

/**
 * Uploads a buffer to Gemini File API.
 * Returns the fileUri for use in subsequent generateContent calls.
 * Files are automatically deleted after 48 hours by Google.
 */
export async function uploadToFileApi(
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<string> {
  const { GoogleAIFileManager } = await import("@google/generative-ai/server");
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

  const { writeFile, unlink } = await import("fs/promises");
  const { tmpdir } = await import("os");
  const { join } = await import("path");
  const { randomUUID } = await import("crypto");

  const tmpPath = join(tmpdir(), `veritrace-${randomUUID()}`);

  try {
    await writeFile(tmpPath, buffer);
    const response = await fileManager.uploadFile(tmpPath, { mimeType, displayName });
    return response.file.uri;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// analyzeWithGrounding — Google Search grounding for claim verification
// ---------------------------------------------------------------------------

// Updated 2026-09-05: One grounding call for all claims — never per individual claim.
// Only triggered when claims.length > 0 from analyzeMedia output.
const GROUNDING_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    contextVerdict: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["corroborated", "partially_verified", "contradicted", "insufficient_data"],
    },
    contextEvidence: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    groundingSources: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING },
          snippet: { type: SchemaType.STRING },
          publisher: { type: SchemaType.STRING },
          credibility: { type: SchemaType.STRING, format: "enum", enum: ["high", "medium", "low"] },
        },
        required: ["title", "url", "snippet"],
      },
    },
  },
  required: ["contextVerdict", "contextEvidence", "groundingSources"],
};

/**
 * Verifies a set of claims using Google Search grounding.
 * Only called when analyzeMedia returns claims.length > 0.
 */
export async function analyzeWithGrounding(claims: string[]): Promise<GroundingResult> {
  if (claims.length === 0) {
    return {
      contextVerdict: "insufficient_data" as ContextVerdict,
      contextEvidence: [],
      groundingSources: [] as GroundingSource[],
    };
  }

  const model = genai.getGenerativeModel({
    model: PRIMARY_MODEL,
    // googleSearchRetrieval is the correct tool name in SDK v0.24.x
    tools: [{ googleSearchRetrieval: {} }],
  });

  const groundingQuery = `
Verify the following claims extracted from potentially manipulated or AI-generated media.

Claims to verify:
${claims.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Search for:
1. Whether the events described actually occurred
2. Whether this specific media has appeared online before
3. Any authoritative sources that corroborate or contradict these claims
4. The original context if the media was repurposed

Based on your research, provide:
- contextVerdict: one of corroborated / partially_verified / contradicted / insufficient_data
- contextEvidence: 2-4 key evidence points (one sentence each)
- groundingSources: the most relevant sources with title, url, snippet, publisher, credibility

Respond in JSON.
  `.trim();

  const result = await model.generateContent(groundingQuery);

  // Extract grounding sources from SDK metadata (typed access)
  const candidates = result.response.candidates ?? [];
  const sdkSources: GroundingSource[] = [];

  for (const candidate of candidates) {
    type ChunkWeb = { uri?: string; title?: string };
    type Chunk = { web?: ChunkWeb };
    type GMeta = { groundingChunks?: Chunk[] };
    const meta = (candidate as unknown as { groundingMetadata?: GMeta }).groundingMetadata;
    if (!meta?.groundingChunks) continue;

    for (const chunk of meta.groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        sdkSources.push({
          title: chunk.web.title,
          url: chunk.web.uri,
          snippet: "",
          credibility: "high",
        });
      }
    }
  }

  let raw: unknown;
  try {
    raw = extractJsonFromResult(result);
  } catch {
    raw = {
      contextVerdict: "insufficient_data",
      contextEvidence: [result.response.text().slice(0, 200)],
      groundingSources: sdkSources,
    };
  }

  const parsed = GroundingResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      contextVerdict: "insufficient_data" as ContextVerdict,
      contextEvidence: [],
      groundingSources: sdkSources,
    };
  }

  // Merge SDK-extracted sources with schema-parsed sources (dedup by URL)
  const mergedSources = [...parsed.data.groundingSources];
  for (const sdkSrc of sdkSources) {
    if (!mergedSources.some((s) => s.url === sdkSrc.url)) {
      mergedSources.push(sdkSrc);
    }
  }

  return {
    ...parsed.data,
    contextVerdict: parsed.data.contextVerdict as ContextVerdict,
    groundingSources: mergedSources as GroundingSource[],
  };
}

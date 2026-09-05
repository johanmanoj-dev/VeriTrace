// lib/types.ts
// Shared TypeScript types for VeriTrace

export type MediaType = "image" | "audio" | "video" | "url";

export type AssessmentVerdict = "likely_manipulated" | "likely_authentic" | "inconclusive";

export type ContextVerdict = "corroborated" | "partially_verified" | "contradicted" | "insufficient_data";

export type IndicatorSeverity = "low" | "medium" | "high";

export interface Indicator {
  type: string;
  severity: IndicatorSeverity;
  explanation: string;
  evidenceRegion?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    label?: string;
  };
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet: string;
  publisher?: string;
  publishedDate?: string;
  credibility?: "high" | "medium" | "low";
}

export interface VerificationReport {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO 8601
  mediaType: MediaType;
  mediaHash?: string;
  sourceUrl?: string;
  fileSize?: number;
  dimensions?: string; // e.g. "1920 × 1080"
  mimeType?: string;
  assessment: AssessmentVerdict;
  confidence: number; // 0.0 to 1.0
  assessmentDescription: string;
  indicators: Indicator[];
  claims: string[];
  contextVerdict: ContextVerdict;
  contextEvidence: string[];
  groundingSources: GroundingSource[];
  geminiFileUri?: string;
}

export type AnalysisStep = "validating" | "analyzing" | "verifying" | "generating_report" | "done" | "error";

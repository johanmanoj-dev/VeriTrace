import Link from "next/link";
import { Upload } from "lucide-react";

export const metadata = {
  title: "How It Works — VeriTrace",
  description: "Learn how VeriTrace detects manipulated media, verifies claims, and traces primary sources.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 py-16">
      {/* Header */}
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
          A Clear Chain of Evidence
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl">
          How VeriTrace Works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">
          VeriTrace uses a multi-stage verification pipeline to detect manipulated media,
          extract verifiable claims, and corroborate evidence against primary sources.
        </p>
      </div>

      {/* 3 Steps Grid */}
      <div className="mt-16 grid grid-cols-1 gap-12 border-t border-neutral-200/80 pt-12 md:grid-cols-3">
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-900 shadow-xs">
            01
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Detect
          </h2>
          <p className="text-xs leading-relaxed text-neutral-600">
            Uploaded media is hashed using SHA-256 for instant cache verification. New media is analyzed
            by Gemini multimodal models to detect synthetic generation indicators:
          </p>
          <ul className="space-y-2 text-xs text-neutral-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Facial geometry and boundary anomalies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Lighting & shadow direction inconsistencies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Audio spectral cuts and voice synthesis cues</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Temporal frame jitter and lip-sync mismatch</span>
            </li>
          </ul>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-900 shadow-xs">
            02
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Explain
          </h2>
          <p className="text-xs leading-relaxed text-neutral-600">
            Rather than a black-box percentage, VeriTrace breaks down the reasoning into
            verifiable visual and forensic indicators:
          </p>
          <ul className="space-y-2 text-xs text-neutral-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Severity rankings: High, Medium, and Low</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Plain-language forensic explanations</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Region-specific markers highlighted on media</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Confidence score calculated from composite signals</span>
            </li>
          </ul>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-900 shadow-xs">
            03
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Verify & Trace
          </h2>
          <p className="text-xs leading-relaxed text-neutral-600">
            Visual inspection is paired with factual grounding. The pipeline extracts real-world
            claims and runs Google Search grounding:
          </p>
          <ul className="space-y-2 text-xs text-neutral-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Claim extraction from captions & scene context</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Google Search grounding cross-referencing</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Authoritative source citation (Reuters, AP, official archives)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span>Context verdict: Corroborated or Contradicted</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Core Principles */}
      <div className="mt-20 rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950">
          Core Principles & Transparency
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs leading-relaxed text-neutral-600">
          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-900">Evidence, Not Proof</h3>
            <p>
              AI detection is not definitive proof. Our platform empowers researchers, journalists,
              and citizens by surfacing indicators so humans can make informed judgments.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-900">Privacy & Efficiency</h3>
            <p>
              Media is hashed with SHA-256 for instant deduplication. Identical files resolve in
              under 50ms without redundant AI inference.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center border-t border-neutral-100 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-5 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <span>Start Verifying Media</span>
            <Upload className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

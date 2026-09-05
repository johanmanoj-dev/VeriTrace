"use client";

import type { AssessmentVerdict, ContextVerdict } from "@/lib/types";

interface VerdictBadgeProps {
  verdict: AssessmentVerdict | ContextVerdict | string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function VerdictBadge({ verdict, size = "md", showDot = true }: VerdictBadgeProps) {
  const normalized = verdict.toLowerCase().replace(/-/g, "_");

  let dotColor = "bg-neutral-400";
  let textColor = "text-neutral-700";
  let label = verdict.toUpperCase().replace(/_/g, " ");

  if (normalized.includes("manipulated") || normalized.includes("contradicted")) {
    dotColor = "bg-amber-600";
    textColor = "text-amber-800";
    label = normalized.includes("manipulated") ? "LIKELY MANIPULATED" : "CONTRADICTED";
  } else if (normalized.includes("authentic") || normalized.includes("corroborated")) {
    dotColor = "bg-emerald-600";
    textColor = "text-emerald-800";
    label = normalized.includes("authentic") ? "LIKELY AUTHENTIC" : "CORROBORATED";
  } else if (normalized.includes("partial")) {
    dotColor = "bg-amber-600";
    textColor = "text-amber-800";
    label = "PARTIALLY VERIFIED";
  } else if (normalized.includes("inconclusive") || normalized.includes("insufficient")) {
    dotColor = "bg-neutral-500";
    textColor = "text-neutral-600";
    label = normalized.includes("inconclusive") ? "INCONCLUSIVE" : "INSUFFICIENT DATA";
  }

  const textSize = size === "sm" ? "text-[11px]" : "text-xs";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tracking-wider ${textSize} ${textColor}`}>
      {showDot && <span className={`rounded-full ${dotSize} ${dotColor}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

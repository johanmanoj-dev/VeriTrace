"use client";

import { useState } from "react";
import { ChevronRight, ShieldAlert, X } from "lucide-react";
import type { Indicator } from "@/lib/types";

interface IndicatorListProps {
  indicators: Indicator[];
  selectedIndicatorIndex?: number | null;
  onSelectIndicator?: (indicator: Indicator, index: number) => void;
}

export function IndicatorList({
  indicators,
  selectedIndicatorIndex,
  onSelectIndicator,
}: IndicatorListProps) {
  const [activeModalIndicator, setActiveModalIndicator] = useState<{
    indicator: Indicator;
    index: number;
  } | null>(null);

  if (!indicators || indicators.length === 0) {
    return (
      <div className="py-6 text-xs text-neutral-500">
        No manipulation indicators detected in this media.
      </div>
    );
  }

  const handleCardClick = (indicator: Indicator, index: number) => {
    onSelectIndicator?.(indicator, index);
    setActiveModalIndicator({ indicator, index });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-neutral-200/80 pb-3">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          01 · Media Analysis
        </p>
        <div className="mt-1 flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Detected indicators
          </h2>
          <span className="text-xs text-neutral-400">
            {indicators.length} {indicators.length === 1 ? "indicator" : "indicators"}
          </span>
        </div>
      </div>

      {/* Indicator Cards */}
      <div className="space-y-4">
        {indicators.map((indicator, index) => {
          const isSelected = selectedIndicatorIndex === index;
          const isHigh = indicator.severity === "high";
          const isMedium = indicator.severity === "medium";
          const borderColor = isHigh
            ? "border-l-amber-700"
            : isMedium
            ? "border-l-amber-600/70"
            : "border-l-neutral-400";

          const severityColor = isHigh
            ? "text-amber-800 font-bold"
            : isMedium
            ? "text-amber-700 font-semibold"
            : "text-neutral-600 font-medium";

          return (
            <div
              key={index}
              id={`indicator-card-${index}`}
              className={`rounded-r-lg border-y border-r border-l-2 border-neutral-200/90 bg-white p-4.5 transition-all ${borderColor} ${
                isSelected ? "ring-2 ring-amber-600/60 shadow-md bg-amber-50/10" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[11px] uppercase tracking-wider ${severityColor}`}>
                  {indicator.severity}
                </span>
                <span className="text-[13.5px] font-semibold text-neutral-900">
                  {indicator.type}
                </span>
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                {indicator.explanation}
              </p>

              <button
                type="button"
                onClick={() => handleCardClick(indicator, index)}
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-neutral-500 transition-colors hover:text-neutral-900 cursor-pointer font-medium"
              >
                <span>
                  View evidence · {indicator.evidenceRegion?.label || indicator.type}
                </span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Evidence Detail Modal */}
      {activeModalIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white shadow">
                  0{activeModalIndicator.index + 1}
                </span>
                <div>
                  <h3 className="text-base font-bold text-neutral-950">
                    {activeModalIndicator.indicator.type}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">
                    Severity: {activeModalIndicator.indicator.severity}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalIndicator(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg bg-neutral-50 p-4 text-xs">
              <p className="font-medium text-neutral-900">Forensic finding:</p>
              <p className="leading-relaxed text-neutral-700">
                {activeModalIndicator.indicator.explanation}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-500">
              <span>Pinned to region on media preview</span>
              <button
                type="button"
                onClick={() => {
                  setActiveModalIndicator(null);
                  const el = document.getElementById("media-evidence-container");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-medium text-neutral-950 underline hover:text-neutral-700"
              >
                Jump to media preview ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

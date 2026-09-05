"use client";

import { ChevronRight } from "lucide-react";
import type { Indicator } from "@/lib/types";

interface IndicatorListProps {
  indicators: Indicator[];
  onSelectIndicator?: (indicator: Indicator, index: number) => void;
}

export function IndicatorList({ indicators, onSelectIndicator }: IndicatorListProps) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="py-6 text-xs text-neutral-500">
        No manipulation indicators detected in this media.
      </div>
    );
  }

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
              className={`rounded-r-lg border-y border-r border-l-2 border-neutral-200/90 bg-white p-4.5 transition-colors ${borderColor}`}
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
                onClick={() => onSelectIndicator?.(indicator, index)}
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-neutral-500 transition-colors hover:text-neutral-900"
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
    </div>
  );
}

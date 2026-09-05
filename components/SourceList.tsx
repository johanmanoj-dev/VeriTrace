"use client";

import { ArrowUpRight } from "lucide-react";
import type { GroundingSource } from "@/lib/types";

interface SourceListProps {
  sources: GroundingSource[];
}

export function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="border-t border-neutral-200/80 pt-6">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          03 · Research
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
          Source trace
        </h2>
        <p className="mt-4 text-xs text-neutral-500">
          No external source traces linked to this assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-3">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          03 · Research
        </p>
        <div className="mt-1 flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Source trace
          </h2>
          <span className="text-xs text-neutral-400">
            {sources.length} relevant {sources.length === 1 ? "source" : "sources"}
          </span>
        </div>
      </div>

      {/* Sources List */}
      <div className="divide-y divide-neutral-200/70 border-b border-neutral-200/70">
        {sources.map((source, index) => {
          const publisher =
            source.publisher ||
            (() => {
              try {
                return new URL(source.url).hostname.replace("www.", "");
              } catch {
                return source.title || "External Source";
              }
            })();

          const credibility = (source.credibility || "high").toUpperCase();

          return (
            <a
              key={index}
              href={source.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block py-4 first:pt-0 transition-colors -mx-2 px-2 rounded-lg hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-950 group-hover:text-emerald-800 transition-colors">
                  {publisher}
                </h3>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  {credibility}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-xs text-neutral-600 line-clamp-1 group-hover:text-neutral-900 group-hover:underline">
                  {source.title || source.snippet}
                </p>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
              </div>

              <p className="mt-1 text-[11px] text-neutral-400">
                {publisher}
                {source.publishedDate ? ` · ${source.publishedDate}` : ""}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

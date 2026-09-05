"use client";

import { Check, AlertCircle } from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { ContextVerdict } from "@/lib/types";

interface ContextVerificationProps {
  claims: string[];
  verdict: ContextVerdict;
  evidence: string[];
}

export function ContextVerification({ claims, verdict, evidence }: ContextVerificationProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-3">
        <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          02 · Context
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
          Context verification
        </h2>
      </div>

      {/* Claim Detected */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            Claim detected
          </p>
          {claims.length > 0 ? (
            <div className="mt-2 space-y-2">
              {claims.map((claim, idx) => (
                <p key={idx} className="text-base font-medium text-neutral-900 leading-snug">
                  &ldquo;{claim}&rdquo;
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-neutral-500">
              No specific factual claims extracted from media context.
            </p>
          )}

          <div className="mt-3">
            <VerdictBadge verdict={verdict} />
          </div>
        </div>

        {/* Evidence List */}
        {evidence && evidence.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Evidence
            </p>
            <ul className="mt-3 space-y-2.5">
              {evidence.map((item, idx) => {
                const isPositive =
                  item.toLowerCase().includes("reported") ||
                  item.toLowerCase().includes("confirmed") ||
                  item.toLowerCase().includes("verified") ||
                  item.startsWith("✓");

                const cleanText = item.replace(/^[✓!•-]\s*/, "");

                return (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed">
                    {isPositive ? (
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-neutral-800 font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-amber-700 font-bold">
                        !
                      </span>
                    )}
                    <span>{cleanText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

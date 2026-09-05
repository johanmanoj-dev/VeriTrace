"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { VerificationReport } from "@/lib/types";

interface ReportSidebarProps {
  report: VerificationReport;
}

export function ReportSidebar({ report }: ReportSidebarProps) {
  const [technicalOpen, setTechnicalOpen] = useState(false);

  return (
    <aside className="space-y-6">
      {/* Report Summary Card */}
      <div className="border-t border-neutral-200/80 pt-4">
        <h3 className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Report summary
        </h3>

        <dl className="mt-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-600">Media authenticity</dt>
            <dd>
              <VerdictBadge verdict={report.assessment} size="sm" />
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-neutral-600">Context match</dt>
            <dd>
              <VerdictBadge verdict={report.contextVerdict} size="sm" />
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-neutral-600">Sources found</dt>
            <dd className="font-semibold text-neutral-900">
              {report.groundingSources?.length || 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* Technical Details Accordion */}
      <div className="border-t border-neutral-200/80 pt-4">
        <button
          type="button"
          onClick={() => setTechnicalOpen((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-[11px] font-semibold tracking-wider text-neutral-500 uppercase hover:text-neutral-950"
          aria-expanded={technicalOpen}
        >
          <span>Technical details</span>
          {technicalOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          )}
        </button>

        {technicalOpen && (
          <div className="mt-3 space-y-2 rounded-lg bg-neutral-50/70 p-3 text-[11px] text-neutral-600 font-mono">
            <div>
              <span className="text-neutral-400 block text-[10px]">REPORT ID</span>
              <span className="break-all">{report.id}</span>
            </div>
            {report.mediaHash && (
              <div>
                <span className="text-neutral-400 block text-[10px]">SHA-256 HASH</span>
                <span className="break-all">{report.mediaHash}</span>
              </div>
            )}
            {report.mimeType && (
              <div>
                <span className="text-neutral-400 block text-[10px]">MIME TYPE</span>
                <span>{report.mimeType}</span>
              </div>
            )}
            {report.fileSize && (
              <div>
                <span className="text-neutral-400 block text-[10px]">FILE SIZE</span>
                <span>{(report.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            )}
            <div>
              <span className="text-neutral-400 block text-[10px]">MODEL</span>
              <span>gemini-3.6-flash</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">ANALYSIS TIMESTAMP</span>
              <span>{report.createdAt}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

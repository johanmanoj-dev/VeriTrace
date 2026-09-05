"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  ChevronRight,
} from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { VerificationReport } from "@/lib/types";

interface ReportsListClientProps {
  initialReports: VerificationReport[];
}

export function ReportsListClient({ initialReports }: ReportsListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Images" | "Audio" | "Video">("All");

  const filteredReports = useMemo(() => {
    return initialReports.filter((report) => {
      // Type filter
      if (activeFilter === "Images" && report.mediaType !== "image") return false;
      if (activeFilter === "Audio" && report.mediaType !== "audio") return false;
      if (activeFilter === "Video" && report.mediaType !== "video") return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = report.title?.toLowerCase().includes(query);
        const claimMatch = report.claims?.some((c) => c.toLowerCase().includes(query));
        return titleMatch || claimMatch;
      }

      return true;
    });
  }, [initialReports, activeFilter, searchQuery]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-neutral-500" />;
      case "audio":
        return <Mic className="h-4 w-4 text-neutral-500" />;
      case "image":
      default:
        return <ImageIcon className="h-4 w-4 text-neutral-500" />;
    }
  };

  const formatShortDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Top Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            Your Workspace
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
            Verification reports
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500">
            A record of your recent media assessments.
          </p>
        </div>

        {/* Analyze media action */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <span>Analyze media</span>
          <Upload className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Search & Filter Tabs */}
      <div className="mt-8 flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {(["All", "Images", "Audio", "Video"] as const).map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-100 text-neutral-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports List */}
      <div className="divide-y divide-neutral-200/70">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const confidencePercent = Math.round((report.confidence || 0) * 100);
            const mediaLabel =
              report.mediaType.charAt(0).toUpperCase() + report.mediaType.slice(1);

            return (
              <div
                key={report.id}
                onClick={() => router.push(`/verify/${report.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/verify/${report.id}`);
                  }
                }}
                className="group flex cursor-pointer items-center justify-between py-5 transition-colors hover:bg-neutral-50/50 px-2 rounded-lg"
              >
                {/* Left: Icon + Title & Date */}
                <div className="flex items-center gap-6">
                  {/* Media Type Icon + Label */}
                  <div className="flex flex-col items-center gap-1 w-10 text-center shrink-0">
                    {getMediaIcon(report.mediaType)}
                    <span className="text-[10px] text-neutral-400 font-medium">{mediaLabel}</span>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-950">
                      {report.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {formatShortDate(report.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: Status + Confidence + Chevron */}
                <div className="flex items-center gap-8">
                  <VerdictBadge verdict={report.assessment} size="sm" />

                  <span className="w-10 text-right text-sm font-bold text-neutral-900">
                    {confidencePercent}%
                  </span>

                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-950 transition-colors" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-8 w-8 text-neutral-300" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">No verification reports</h3>
            <p className="mt-1 text-xs text-neutral-500">
              {searchQuery ? "No reports matched your search criteria." : "Analyze your first image, audio, or video above."}
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs"
            >
              <Upload className="h-3 w-3" />
              <span>Verify Media Now</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

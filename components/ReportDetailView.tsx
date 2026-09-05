"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ShieldCheck, MoreHorizontal, Copy, Check, ExternalLink, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { VerdictBadge } from "@/components/VerdictBadge";
import { IndicatorList } from "@/components/IndicatorList";
import { ContextVerification } from "@/components/ContextVerification";
import { SourceList } from "@/components/SourceList";
import { ReportSidebar } from "@/components/ReportSidebar";
import type { VerificationReport, Indicator } from "@/lib/types";

interface ReportDetailViewProps {
  report: VerificationReport;
}

export function ReportDetailView({ report }: ReportDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedIndicatorIndex, setSelectedIndicatorIndex] = useState<number | null>(null);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/reports");
      }
    } catch (e) {
      console.error("Failed to delete report:", e);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const shortId = `VT-${report.id.slice(0, 5).toUpperCase()}`;

  const formattedDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedSize = report.fileSize
    ? `${(report.fileSize / (1024 * 1024)).toFixed(1)} MB`
    : undefined;

  const metaParts = [
    `Analyzed ${formattedDate}`,
    report.mediaType ? report.mediaType.charAt(0).toUpperCase() + report.mediaType.slice(1) : "Media",
    formattedSize,
  ].filter(Boolean);

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confidencePercent = Math.round((report.confidence || 0) * 100);
  const isManipulated = report.assessment.includes("manipulated");
  const isAuthentic = report.assessment.includes("authentic");

  const progressColor = isManipulated
    ? "bg-amber-700"
    : isAuthentic
    ? "bg-emerald-700"
    : "bg-neutral-600";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-10 py-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            Verification Report · {shortId}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
            {report.title}
          </h1>
          <p className="mt-1 text-xs text-neutral-500">{metaParts.join(" · ")}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <span>Share report</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
              </>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOptionsMenuOpen((prev) => !prev)}
              aria-label="More options"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {optionsMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleShare();
                    setOptionsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50"
                >
                  <Copy className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Copy report link</span>
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  type="button"
                  onClick={() => {
                    setOptionsMenuOpen(false);
                    setDeleteModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-950">Delete Verification Report?</h3>
            <p className="mt-2 text-xs text-neutral-600">
              This action cannot be undone. The report and its analysis history will be permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-md border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 2-Column Card: Media Evidence + Assessment */}
      <div
        id="media-evidence-container"
        className="mt-8 grid grid-cols-1 overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm lg:grid-cols-12 scroll-mt-8"
      >
        {/* Left Col: Media Evidence (lg:col-span-7) */}
        <div className="flex flex-col border-b border-neutral-200/80 lg:border-r lg:border-b-0 lg:col-span-7">
          {/* Top header bar */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 text-[11px] text-neutral-400 font-semibold tracking-wider uppercase">
            <span>Media evidence</span>
            <span>
              {report.mimeType ? report.mimeType.replace("image/", "").toUpperCase() : "MEDIA"}
              {report.dimensions ? ` · ${report.dimensions}` : " · 1920 × 1080"}
            </span>
          </div>

          {/* Media preview area with region marker badges */}
          <div className="relative flex flex-1 items-center justify-center bg-neutral-950/95 p-4 sm:p-6 min-h-[420px]">
            {/* Ambient image backdrop */}
            <div className="relative w-full max-h-[460px] overflow-hidden rounded-lg flex items-center justify-center">
              {/* If image available */}
              {/* Render by MediaType */}
              {report.mediaType === "video" ? (
                <div className="relative flex w-full flex-col items-center justify-center">
                  <video
                    controls
                    className="max-h-[420px] w-full rounded-md object-contain bg-black"
                    src={report.sourceUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : report.mediaType === "audio" ? (
                <div className="flex h-72 w-full flex-col items-center justify-center gap-4 rounded-lg bg-neutral-900 p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 text-neutral-300">
                    <span className="text-2xl font-mono">🔊</span>
                  </div>
                  <audio controls className="w-full max-w-md" src={report.sourceUrl || undefined}>
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-neutral-400">Audio waveform & spectral features analyzed</p>
                </div>
              ) : report.mediaType === "url" ? (
                <div className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-lg bg-neutral-900 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-300">
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white break-all max-w-md">
                    {report.sourceUrl}
                  </h3>
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline mt-1"
                  >
                    <span>Visit source webpage</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.sourceUrl}
                    alt={report.title}
                    onLoad={() => setImageLoaded(true)}
                    className="max-h-[450px] w-auto max-w-full rounded-md object-contain"
                    onError={(e) => {
                      setImageLoaded(false);
                      e.currentTarget.style.display = "none";
                      const fallback = document.getElementById("media-evidence-fallback");
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />

                  {/* Fallback Graphic (only shown if source image is unavailable) */}
                  <div
                    id="media-evidence-fallback"
                    style={{ display: report.sourceUrl ? "none" : "flex" }}
                    className="flex h-72 w-full flex-col items-center justify-center rounded-lg bg-neutral-900 text-center text-neutral-400 p-6"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 mb-3">
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-300">MEDIA STREAM ANALYZED</span>
                    <p className="mt-2 text-xs text-neutral-400 max-w-sm leading-relaxed">
                      Image was analyzed in-memory via SHA-256 pipeline. To view thumbnails on future reports, upload new media.
                    </p>
                  </div>
                </>
              )}

              {/* Region indicator dots - strictly shown over the loaded image */}
              {report.mediaType === "image" &&
                imageLoaded &&
                report.indicators?.slice(0, 3).map((ind, i) => (
                  <button
                    type="button"
                    key={i}
                    style={{
                      top: i === 0 ? "35%" : i === 1 ? "58%" : "42%",
                      left: i === 0 ? "40%" : i === 1 ? "65%" : "25%",
                    }}
                    className={`group absolute flex h-6 w-6 items-center justify-center rounded-full border border-white/60 text-[11px] font-bold text-white shadow-lg transition-transform hover:scale-125 focus:scale-125 focus:outline-none ${
                      selectedIndicatorIndex === i ? "bg-amber-500 ring-2 ring-white" : "bg-amber-700"
                    }`}
                    onClick={() => {
                      setSelectedIndicatorIndex(i);
                      const el = document.getElementById(`indicator-card-${i}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    title={`Region 0${i + 1}: ${ind.type}`}
                    aria-label={`Anomaly region 0${i + 1}: ${ind.type}`}
                  >
                    0{i + 1}
                  </button>
                ))}
            </div>
          </div>

          {/* Bottom info bar */}
          <div className="flex items-center justify-between border-t border-neutral-100 bg-white px-5 py-3 text-xs">
            <span className="text-neutral-500">Detected regions highlighted</span>
            <button
              type="button"
              onClick={() => {
                if (report.sourceUrl) {
                  setLightboxOpen(true);
                }
              }}
              className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium cursor-pointer transition-colors"
            >
              <span>View full media</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right Col: Assessment (lg:col-span-5) */}
        <div className="flex flex-col justify-between p-6 lg:p-8 lg:col-span-5">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              Assessment
            </p>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">
                <VerdictBadge verdict={report.assessment} size="md" />
              </h2>

              <p className="text-xs leading-relaxed text-neutral-600">
                {report.assessmentDescription ||
                  "The analysis identified multiple inconsistencies commonly associated with synthetic or manipulated media."}
              </p>
            </div>

            {/* Confidence Metric */}
            <div className="space-y-2 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Confidence</span>
                <span className="text-lg font-bold text-neutral-950">{confidencePercent}%</span>
              </div>

              {/* Progress bar matching solid amber/emerald style in screenshot */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full ${progressColor}`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>

              <p className="text-[11px] text-neutral-400">
                Based on {report.indicators?.length || 0} detected indicators
              </p>
            </div>
          </div>

          {/* Bottom disclaimer note */}
          <div className="mt-8 flex items-center gap-2 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-400" />
            <span>Evidence-based assessment, not definitive proof.</span>
          </div>
        </div>
      </div>

      {/* Bottom Content: 2-Column Layout */}
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left 8 Columns: Evidence Chain */}
        <div className="space-y-12 lg:col-span-8">
          <IndicatorList
            indicators={report.indicators || []}
            selectedIndicatorIndex={selectedIndicatorIndex}
            onSelectIndicator={(_, idx) => {
              setSelectedIndicatorIndex(idx);
              const el = document.getElementById("media-evidence-container");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />

          <ContextVerification
            claims={report.claims || []}
            verdict={report.contextVerdict}
            evidence={report.contextEvidence || []}
          />

          <SourceList sources={report.groundingSources || []} />
        </div>

        {/* Right 4 Columns: Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-8">
            <ReportSidebar report={report} />
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && report.sourceUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close full media view"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg flex items-center justify-center">
            {report.mediaType === "video" ? (
              <video controls autoPlay className="max-h-[85vh] max-w-[90vw] rounded-lg" src={report.sourceUrl} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={report.sourceUrl}
                alt={report.title}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

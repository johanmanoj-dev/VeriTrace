"use client";

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowUpRight, Image as ImageIcon, Mic, Video, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { validateMediaFile, validateUrl } from "@/lib/validation";
import { AnalysisProgress } from "@/components/AnalysisProgress";

export function MediaDropzone() {
  const { user } = useAuth();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<
    "validating" | "analyzing" | "verifying" | "generating" | "done"
  >("validating");
  const [analyzedFileName, setAnalyzedFileName] = useState("");

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);

    if (!user) {
      router.push("/login?from=/");
      return;
    }

    // 1. Validate file (magic bytes + size limits)
    const validation = await validateMediaFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setAnalyzedFileName(file.name);
    setIsAnalyzing(true);
    setAnalysisStep("validating");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      // Create compressed preview thumbnail for report view
      if (file.type.startsWith("image/")) {
        try {
          const thumb = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const scale = Math.min(1, MAX_WIDTH / img.width);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL("image/jpeg", 0.75));
                } else {
                  resolve(null);
                }
              };
              img.onerror = () => resolve(null);
              img.src = ev.target?.result as string;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
          if (thumb) {
            formData.append("thumbnail", thumb);
          }
        } catch {
          // Non-blocking thumbnail generation
        }
      }

      // Call verification endpoint
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process media");
      }

      const result = await response.json();

      // Progress animation simulation for Phase 2 UI test
      setAnalysisStep("analyzing");
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep("verifying");
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep("generating");
      await new Promise((r) => setTimeout(r, 400));
      setAnalysisStep("done");

      // Redirect if reportId present or redirect to reports view
      if (result.reportId) {
        router.push(`/verify/${result.reportId}`);
      } else {
        router.push("/reports");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during verification.";
      setErrorMessage(msg);
      setIsAnalyzing(false);
    }
  };

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      router.push("/login?from=/");
      return;
    }

    const urlCheck = validateUrl(urlInput);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      setErrorMessage(urlCheck.error || "Please enter a valid HTTPS URL.");
      return;
    }

    setAnalyzedFileName(urlCheck.normalizedUrl);
    setIsAnalyzing(true);
    setAnalysisStep("validating");

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlCheck.normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze URL");
      }

      const result = await response.json();

      setAnalysisStep("analyzing");
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep("verifying");
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep("generating");
      await new Promise((r) => setTimeout(r, 400));
      setAnalysisStep("done");

      if (result.reportId) {
        router.push(`/verify/${result.reportId}`);
      } else {
        router.push("/reports");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while verifying the URL.";
      setErrorMessage(msg);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl sm:max-w-[720px] mx-auto">
      {/* Upload Card */}
      <div
        className={`relative rounded-2xl border bg-white p-8 sm:p-10 shadow-sm transition-all duration-200 ${
          isDragging ? "border-neutral-950 ring-2 ring-neutral-950/10" : "border-neutral-200"
        }`}
      >
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
          aria-label="Upload file for verification"
        />

        {/* Drag & Drop Hero Section */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {/* Circle Icon */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 transition-transform group-hover:scale-105">
            <Upload className="h-5 w-5" />
          </div>

          <h2 className="mt-3.5 text-lg font-semibold text-neutral-900">
            Drop media here
          </h2>
          <p className="mt-1 text-xs text-neutral-500">Images · Audio · Video</p>

          {/* Button */}
          <button
            type="button"
            className="mt-4.5 inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Choose file
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Divider with 'or' */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200/80" />
          </div>
          <span className="relative bg-white px-3 text-xs text-neutral-400">or</span>
        </div>

        {/* Analyze from URL Section */}
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <label
            htmlFor="url-input"
            className="block text-[11px] font-semibold tracking-wider text-neutral-500 uppercase"
          >
            Analyze from URL
          </label>
          <div className="flex items-center gap-2">
            <input
              id="url-input"
              type="url"
              placeholder="Paste a public media or webpage URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-10 flex-1 rounded-md border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
            />
            <button
              type="submit"
              aria-label="Analyze URL"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Error Alert Display */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs text-red-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Sub-bar below upload card */}
      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 text-xs">
        <div className="flex items-center gap-3 text-neutral-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ImageIcon className="h-3.5 w-3.5 text-neutral-400" /> Images
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Mic className="h-3.5 w-3.5 text-neutral-400" /> Audio
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Video className="h-3.5 w-3.5 text-neutral-400" /> Video
          </span>
        </div>
        <p className="text-[11.5px] text-neutral-400">
          Analysis includes: AI indicators · contextual verification · source tracing
        </p>
      </div>

      {/* Progress Dialog */}
      <AnalysisProgress
        isOpen={isAnalyzing}
        currentStep={analysisStep}
        fileName={analyzedFileName}
      />
    </div>
  );
}

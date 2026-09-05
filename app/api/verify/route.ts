// app/api/verify/route.ts
// POST /api/verify — main verification endpoint
// Pipeline: Auth → Rate limit → Validate → runPipeline() → return report
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateMagicBytes, validateUrl, MAX_IMAGE_AUDIO_SIZE, MAX_VIDEO_SIZE } from "@/lib/validation";
import { runPipeline, PipelineError } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing authentication token" },
      { status: 401 }
    );
  }

  const idToken = authHeader.split("Bearer ")[1];
  let userId: string;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return NextResponse.json(
      { error: "Unauthorized: Invalid authentication token" },
      { status: 401 }
    );
  }

  // ── 2. Rate limiting (burst + hourly) ─────────────────────────────────────
  const burstCheck = checkRateLimit(userId, "verify:burst", RATE_LIMITS.verifyBurst);
  if (!burstCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before submitting again.", retryAfter: burstCheck.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": burstCheck.retryAfter.toString(),
          "X-RateLimit-Limit": burstCheck.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": burstCheck.resetAt.toString(),
        },
      }
    );
  }

  const hourlyCheck = checkRateLimit(userId, "verify:hourly", RATE_LIMITS.verifyHourly);
  if (!hourlyCheck.allowed) {
    return NextResponse.json(
      { error: "Hourly verification limit reached. Try again later.", retryAfter: hourlyCheck.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": hourlyCheck.retryAfter.toString(),
          "X-RateLimit-Limit": hourlyCheck.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": hourlyCheck.resetAt.toString(),
        },
      }
    );
  }

  const rateLimitHeaders = {
    "X-RateLimit-Limit": burstCheck.limit.toString(),
    "X-RateLimit-Remaining": burstCheck.remaining.toString(),
    "X-RateLimit-Reset": burstCheck.resetAt.toString(),
  };

  // ── 3. Parse payload & run pipeline ───────────────────────────────────────
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // ── FILE UPLOAD ──
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No media file provided" }, { status: 400 });
    }

    const isVideo =
      file.type.startsWith("video/") ||
      file.name.toLowerCase().endsWith(".mp4") ||
      file.name.toLowerCase().endsWith(".mov");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_AUDIO_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds the ${isVideo ? "100MB" : "20MB"} limit.` },
        { status: 400 }
      );
    }

    // Magic byte check (don't trust Content-Type header alone)
    const headerSlice = await file.slice(0, 32).arrayBuffer();
    const magic = validateMagicBytes(new Uint8Array(headerSlice));
    if (!magic.valid) {
      return NextResponse.json(
        { error: "Invalid file content or unsupported media type." },
        { status: 400 }
      );
    }

    const thumbnail = formData.get("thumbnail");
    const previewUrl = typeof thumbnail === "string" && thumbnail.startsWith("data:image/") ? thumbnail : undefined;

    try {
      const report = await runPipeline({ kind: "file", file, userId, previewUrl });
      return NextResponse.json(
        { reportId: report.id, report },
        { status: 200, headers: rateLimitHeaders }
      );
    } catch (err) {
      if (err instanceof PipelineError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode, headers: rateLimitHeaders });
      }
      console.error("[POST /api/verify] Unexpected pipeline error:", err instanceof Error ? err.message : String(err));
      return NextResponse.json({ error: "Internal server error during analysis." }, { status: 500 });
    }
  }

  if (contentType.includes("application/json")) {
    // ── URL SUBMISSION ──
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawUrl = (body as Record<string, unknown>)?.url;
    if (typeof rawUrl !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'url' field in request body." }, { status: 400 });
    }

    const urlCheck = validateUrl(rawUrl);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return NextResponse.json({ error: urlCheck.error ?? "Invalid URL." }, { status: 400 });
    }

    try {
      const report = await runPipeline({ kind: "url", url: urlCheck.normalizedUrl, userId });
      return NextResponse.json(
        { reportId: report.id, report },
        { status: 200, headers: rateLimitHeaders }
      );
    } catch (err) {
      if (err instanceof PipelineError) {
        return NextResponse.json({ error: err.message }, { status: err.statusCode, headers: rateLimitHeaders });
      }
      console.error("[POST /api/verify] Unexpected pipeline error:", err instanceof Error ? err.message : String(err));
      return NextResponse.json({ error: "Internal server error during analysis." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
}

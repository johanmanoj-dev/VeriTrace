import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateMagicBytes, validateUrl, MAX_IMAGE_AUDIO_SIZE, MAX_VIDEO_SIZE } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // 1. Auth check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Unauthorized: Invalid authentication token" }, { status: 401 });
  }

  const userId = decodedToken.uid;

  // 2. Rate limiting check (Burst & Hourly)
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

  // 3. Payload validation
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
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

    const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_AUDIO_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds allowed limit (${isVideo ? "100MB" : "20MB"})` },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fileBuffer.slice(0, 32));
    const magicValidation = validateMagicBytes(bytes);

    if (!magicValidation.valid || !magicValidation.detectedMime) {
      return NextResponse.json(
        { error: "Invalid file content or unsupported media format" },
        { status: 400 }
      );
    }

    // Skeleton response for Phase 2; Phase 3 connects real pipeline
    return NextResponse.json(
      {
        status: "validated",
        mediaType: isVideo ? "video" : magicValidation.detectedMime.startsWith("audio/") ? "audio" : "image",
        mimeType: magicValidation.detectedMime,
        fileSize: file.size,
        fileName: file.name,
        message: "Media validated successfully. Pipeline ready for Phase 3 analysis.",
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": burstCheck.limit.toString(),
          "X-RateLimit-Remaining": burstCheck.remaining.toString(),
          "X-RateLimit-Reset": burstCheck.resetAt.toString(),
        },
      }
    );
  } else if (contentType.includes("application/json")) {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const urlCheck = validateUrl(body?.url);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return NextResponse.json({ error: urlCheck.error || "Invalid URL" }, { status: 400 });
    }

    return NextResponse.json(
      {
        status: "validated",
        mediaType: "url",
        sourceUrl: urlCheck.normalizedUrl,
        message: "URL validated successfully. Pipeline ready for Phase 3 analysis.",
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": burstCheck.limit.toString(),
          "X-RateLimit-Remaining": burstCheck.remaining.toString(),
          "X-RateLimit-Reset": burstCheck.resetAt.toString(),
        },
      }
    );
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
}

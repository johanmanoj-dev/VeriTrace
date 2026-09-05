// lib/validation.ts
// Validation rules for media uploads and URLs

export const MAX_IMAGE_AUDIO_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/mp3",
  "video/mp4",
  "video/quicktime",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export type ValidationResult =
  | { valid: true; mediaType: "image" | "audio" | "video"; mimeType: AllowedMimeType }
  | { valid: false; error: string };

/**
 * Validates magic bytes from file header buffer.
 */
export function validateMagicBytes(buffer: Uint8Array): { valid: boolean; detectedMime?: AllowedMimeType } {
  if (buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: "image/webp" };
  }

  // WAV: "RIFF" .... "WAVE"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return { valid: true, detectedMime: "audio/wav" };
  }

  // MP3: "ID3" tag or sync word 0xFF 0xFB/F3/F2
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detectedMime: "audio/mpeg" };
  }

  // MP4 / MOV: check ftyp box at offset 4
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    // Check brand
    const brand = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
    if (brand.startsWith("qt")) {
      return { valid: true, detectedMime: "video/quicktime" };
    }
    return { valid: true, detectedMime: "video/mp4" };
  }

  return { valid: false };
}

/**
 * Validates uploaded media file attributes and magic bytes.
 */
export async function validateMediaFile(file: File): Promise<ValidationResult> {
  const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_AUDIO_SIZE;

  if (file.size > maxSize) {
    const limitMb = isVideo ? 100 : 20;
    return { valid: false, error: `File size exceeds the ${limitMb}MB limit.` };
  }

  // Read first 32 bytes for magic byte check
  const headerSlice = file.slice(0, 32);
  const arrayBuffer = await headerSlice.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const magic = validateMagicBytes(bytes);
  if (!magic.valid || !magic.detectedMime) {
    return {
      valid: false,
      error: "Unsupported file type or corrupted file. Allowed: JPG, PNG, WEBP, MP3, WAV, MP4, MOV.",
    };
  }

  let mediaType: "image" | "audio" | "video" = "image";
  if (magic.detectedMime.startsWith("audio/")) mediaType = "audio";
  if (magic.detectedMime.startsWith("video/")) mediaType = "video";

  return { valid: true, mediaType, mimeType: magic.detectedMime };
}

/**
 * Validates submitted URL.
 */
export function validateUrl(rawUrl: string): { valid: boolean; error?: string; normalizedUrl?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "Please enter a valid URL." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format. Example: https://example.com/media" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only secure HTTPS URLs are supported." };
  }

  if (!parsed.hostname || parsed.hostname.length < 3) {
    return { valid: false, error: "Invalid domain name." };
  }

  // Reject local/internal addresses and cloud metadata services (SSRF prevention)
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "metadata.google.internal" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.startsWith("127.") ||
    host.startsWith("169.254.") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("0.0.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host === "::1" ||
    host === "0.0.0.0"
  ) {
    return { valid: false, error: "Internal or cloud metadata URLs are not allowed." };
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}

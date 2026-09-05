import { describe, it, expect } from "vitest";
import {
  validateMagicBytes,
  validateUrl,
  validateMediaFile,
  MAX_IMAGE_AUDIO_SIZE,
} from "@/lib/validation";

describe("lib/validation", () => {
  describe("validateMagicBytes", () => {
    it("detects valid JPEG magic bytes", () => {
      const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const res = validateMagicBytes(jpeg);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe("image/jpeg");
    });

    it("detects valid PNG magic bytes", () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const res = validateMagicBytes(png);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe("image/png");
    });

    it("detects valid WEBP magic bytes", () => {
      // RIFF....WEBP
      const webp = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const res = validateMagicBytes(webp);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe("image/webp");
    });

    it("detects valid MP4 magic bytes", () => {
      // ....ftypisom
      const mp4 = new Uint8Array([
        0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      ]);
      const res = validateMagicBytes(mp4);
      expect(res.valid).toBe(true);
      expect(res.detectedMime).toBe("video/mp4");
    });

    it("rejects unknown or invalid magic bytes", () => {
      const invalid = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
      const res = validateMagicBytes(invalid);
      expect(res.valid).toBe(false);
    });

    it("rejects buffer smaller than 12 bytes", () => {
      const tiny = new Uint8Array([0xff, 0xd8]);
      const res = validateMagicBytes(tiny);
      expect(res.valid).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("accepts valid HTTPS url", () => {
      const res = validateUrl("https://example.com/article/123");
      expect(res.valid).toBe(true);
      expect(res.normalizedUrl).toBe("https://example.com/article/123");
    });

    it("rejects HTTP url (HTTPS only)", () => {
      const res = validateUrl("http://example.com/image.jpg");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Only secure HTTPS URLs");
    });

    it("rejects localhost or SSRF targets", () => {
      const localhost = validateUrl("https://localhost/secret");
      expect(localhost.valid).toBe(false);

      const internalIp = validateUrl("https://127.0.0.1/admin");
      expect(internalIp.valid).toBe(false);

      const cloudMetadata = validateUrl("https://169.254.169.254/latest/meta-data/");
      expect(cloudMetadata.valid).toBe(false);

      const gcpMetadata = validateUrl("https://metadata.google.internal/computeMetadata/v1/");
      expect(gcpMetadata.valid).toBe(false);
    });

    it("rejects malformed URLs", () => {
      const invalid = validateUrl("not-a-valid-url");
      expect(invalid.valid).toBe(false);
    });
  });

  describe("validateMediaFile", () => {
    it("rejects files exceeding size limits", async () => {
      const oversizedImage = new File([new Uint8Array(MAX_IMAGE_AUDIO_SIZE + 1024)], "huge.jpg", {
        type: "image/jpeg",
      });
      const res = await validateMediaFile(oversizedImage);
      expect(res.valid).toBe(false);
      expect((res as { error: string }).error).toContain("exceeds the 20MB limit");
    });
  });
});

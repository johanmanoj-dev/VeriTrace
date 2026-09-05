// lib/cache.ts
// SHA-256 dedup cache — checks Firestore before calling Gemini
import "server-only";
import { createHash } from "crypto";
import { adminDb } from "@/firebase/admin";

/**
 * Computes SHA-256 hash of media bytes for cache key.
 */
export function computeHash(buffer: Buffer | Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Looks up a hash in the Firestore cache.
 * Returns the reportId if found, null if cache miss.
 */
export async function getCachedReportId(hash: string): Promise<string | null> {
  const doc = await adminDb.collection("cache").doc(hash).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return (data?.reportId as string) ?? null;
}

/**
 * Writes hash → reportId mapping to Firestore cache.
 * Only called by server-side pipeline after successful report creation.
 */
export async function setCachedReportId(hash: string, reportId: string): Promise<void> {
  await adminDb.collection("cache").doc(hash).set({
    reportId,
    createdAt: new Date().toISOString(),
  });
}

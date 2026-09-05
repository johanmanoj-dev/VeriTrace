// lib/firestore.ts — SERVER ONLY
// Report CRUD operations via Firebase Admin SDK
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/firebase/admin";
import type { VerificationReport } from "@/lib/types";

type ReportCreateInput = Omit<VerificationReport, "id" | "createdAt">;

/**
 * Creates a new verification report in Firestore.
 * Returns the assigned reportId.
 */
export async function createReport(data: ReportCreateInput): Promise<string> {
  const ref = adminDb.collection("reports").doc();
  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Retrieves a single report by ID.
 * Returns null if the document does not exist.
 */
export async function getReport(reportId: string): Promise<VerificationReport | null> {
  const doc = await adminDb.collection("reports").doc(reportId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    ...data,
    createdAt:
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? (data.createdAt.toDate() as Date).toISOString()
        : (data.createdAt as string),
  } as VerificationReport;
}

/**
 * Returns all reports belonging to a user, ordered newest first.
 * Limit defaults to 50 — sufficient for hackathon scale.
 */
export async function getUserReports(userId: string, limit = 50): Promise<VerificationReport[]> {
  const snapshot = await adminDb
    .collection("reports")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? (data.createdAt.toDate() as Date).toISOString()
          : (data.createdAt as string),
    } as VerificationReport;
  });
}

/**
 * Deletes a report only if it belongs to the requesting user.
 * Returns false if the report doesn't exist or doesn't belong to the user.
 */
export async function deleteReport(reportId: string, userId: string): Promise<boolean> {
  const doc = await adminDb.collection("reports").doc(reportId).get();
  if (!doc.exists) return false;
  if (doc.data()?.userId !== userId) return false;

  await adminDb.collection("reports").doc(reportId).delete();
  return true;
}

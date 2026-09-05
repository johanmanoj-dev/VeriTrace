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

function mapDocToReport(doc: FirebaseFirestore.DocumentSnapshot): VerificationReport {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    createdAt:
      data.createdAt && typeof data.createdAt.toDate === "function"
        ? (data.createdAt.toDate() as Date).toISOString()
        : (data.createdAt as string) || new Date().toISOString(),
  } as VerificationReport;
}

/**
 * Returns all reports belonging to a user, ordered newest first.
 * Limit defaults to 50 — includes resilient in-memory sort fallback.
 */
export async function getUserReports(userId: string, limit = 50): Promise<VerificationReport[]> {
  try {
    const snapshot = await adminDb
      .collection("reports")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(mapDocToReport);
  } catch {
    // Resilient fallback: query without composite orderBy and sort in memory
    const snapshot = await adminDb
      .collection("reports")
      .where("userId", "==", userId)
      .get();

    const reports = snapshot.docs.map(mapDocToReport);
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reports.slice(0, limit);
  }
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

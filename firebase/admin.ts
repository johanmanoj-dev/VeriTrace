// firebase/admin.ts — SERVER ONLY
// Never import this file in Client Components or any file that can be imported client-side
import "server-only";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey(): string {
  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
  // Strip surrounding quotes added by .env.local JSON.stringify
  const stripped = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  return stripped.replace(/\\n/g, "\n");
}

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

const adminApp = initAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

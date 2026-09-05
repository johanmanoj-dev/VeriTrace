// firebase/admin.ts — SERVER ONLY
// Never import this file in Client Components or any file that can be imported client-side
import "server-only";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getPrivateKey(): string {
  let key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set in environment variables");

  // Remove accidental variable name prefix if pasted with "FIREBASE_ADMIN_PRIVATE_KEY="
  if (key.startsWith("FIREBASE_ADMIN_PRIVATE_KEY=")) {
    key = key.replace(/^FIREBASE_ADMIN_PRIVATE_KEY=/, "");
  }

  // Strip surrounding quotes
  key = key.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n");
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

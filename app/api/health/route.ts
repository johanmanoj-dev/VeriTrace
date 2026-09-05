// app/api/health/route.ts
// Diagnostic endpoint to check serverless health and environment variables
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const geminiKey = process.env.GEMINI_API_KEY;

  const envCheck = {
    GEMINI_API_KEY: {
      isSet: Boolean(geminiKey),
      length: geminiKey?.length ?? 0,
      prefix: geminiKey ? geminiKey.slice(0, 4) + "..." : "missing",
    },
    FIREBASE_ADMIN_PROJECT_ID: {
      isSet: Boolean(projectId),
      value: projectId ?? "missing",
    },
    FIREBASE_ADMIN_CLIENT_EMAIL: {
      isSet: Boolean(clientEmail),
      value: clientEmail ? clientEmail.slice(0, 8) + "..." : "missing",
    },
    FIREBASE_ADMIN_PRIVATE_KEY: {
      isSet: Boolean(privateKey),
      length: privateKey?.length ?? 0,
      hasBeginHeader: privateKey?.includes("BEGIN PRIVATE KEY") ?? false,
      hasEndFooter: privateKey?.includes("END PRIVATE KEY") ?? false,
    },
  };

  let adminInitStatus = "unknown";
  try {
    const { getAdminApp } = await import("@/firebase/admin");
    getAdminApp();
    adminInitStatus = "success";
  } catch (err) {
    adminInitStatus = `failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(
    {
      status: "online",
      nodeVersion: process.version,
      firebaseAdmin: adminInitStatus,
      env: envCheck,
    },
    { status: 200 }
  );
}

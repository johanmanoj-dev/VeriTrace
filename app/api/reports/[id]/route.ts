// app/api/reports/[id]/route.ts
// GET  /api/reports/[id] — fetch single report (owner only)
// DELETE /api/reports/[id] — delete report (owner only)
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getReport, deleteReport } from "@/lib/firestore";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  // 1. Auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  // 2. Rate limit
  const rl = checkRateLimit(userId, "reports:detail", RATE_LIMITS.reportDetail);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": rl.retryAfter.toString(),
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rl.resetAt.toString(),
        },
      }
    );
  }

  // 3. Fetch + ownership check
  try {
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    if (report.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { report },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": rl.remaining.toString(),
          "X-RateLimit-Reset": rl.resetAt.toString(),
        },
      }
    );
  } catch (err) {
    console.error(`[GET /api/reports/${id}]`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;

  // 1. Auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  // 2. Rate limit
  const rl = checkRateLimit(userId, "reports:delete", RATE_LIMITS.reportDelete);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": rl.retryAfter.toString(),
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rl.resetAt.toString(),
        },
      }
    );
  }

  // 3. Delete with ownership enforcement
  try {
    const deleted = await deleteReport(id, userId);
    if (!deleted) {
      return NextResponse.json({ error: "Report not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": rl.limit.toString(),
          "X-RateLimit-Remaining": rl.remaining.toString(),
          "X-RateLimit-Reset": rl.resetAt.toString(),
        },
      }
    );
  } catch (err) {
    console.error(`[DELETE /api/reports/${id}]`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}

// app/api/reports/route.ts
// GET /api/reports — returns authenticated user's report history
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getUserReports } from "@/lib/firestore";

export async function GET(request: NextRequest) {
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
  const rl = checkRateLimit(userId, "reports:list", RATE_LIMITS.reportsList);
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

  // 3. Fetch
  try {
    const reports = await getUserReports(userId);
    return NextResponse.json(
      { reports },
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
    console.error("[GET /api/reports]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

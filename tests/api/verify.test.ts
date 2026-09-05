// tests/api/verify.test.ts
// Integration tests for POST /api/verify endpoint
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// Mock Firebase Admin
vi.mock("@/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token.startsWith("valid-token")) return { uid: `user-${token}` };
      throw new Error("Invalid token");
    }),
  },
  adminDb: {},
}));

// Mock pipeline
vi.mock("@/lib/pipeline", () => ({
  runPipeline: vi.fn(async () => ({
    id: "rep-abc-123",
    title: "Mocked Test Report",
    assessment: "likely_authentic",
    confidence: 0.95,
  })),
  PipelineError: class PipelineError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { POST } from "@/app/api/verify/route";

describe("POST /api/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Missing authentication token");
  });

  it("returns 401 if token is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid authentication token");
  });

  it("returns 400 for invalid JSON or missing url in URL mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing or invalid 'url'");
  });

  it("returns 400 for non-HTTPS or SSRF url targets", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: "http://localhost:8080/secret" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with reportId for valid HTTPS url", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: "https://example.com/news/123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reportId).toBe("rep-abc-123");
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });

  it("returns 429 with Retry-After and X-RateLimit headers when burst rate limit exceeded", async () => {
    const burstToken = "valid-token-burst-test";
    // Hit the 5-request burst limit
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest("http://localhost:3000/api/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${burstToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: `https://example.com/page/${i}` }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 6th request must be rejected with 429
    const overLimitReq = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${burstToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: "https://example.com/page/over-limit" }),
    });

    const res = await POST(overLimitReq);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    const body = await res.json();
    expect(body.error).toContain("Rate limit exceeded");
  });

  it("returns 400 for unsupported content-type", async () => {
    const req = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token-content",
        "Content-Type": "text/plain",
      },
      body: "plain text payload",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Unsupported content type");
  });
});

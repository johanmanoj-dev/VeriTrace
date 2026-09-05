// tests/api/reports.test.ts
// Integration tests for GET /api/reports, GET /api/reports/[id], DELETE /api/reports/[id]
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === "valid-token") return { uid: "user-abc" };
      throw new Error("Invalid token");
    }),
  },
  adminDb: {},
}));

vi.mock("@/lib/firestore", () => ({
  getUserReports: vi.fn(async () => [
    {
      id: "rep-001",
      userId: "user-abc",
      title: "Test Report",
      assessment: "likely_authentic",
      confidence: 0.9,
      createdAt: new Date().toISOString(),
    },
  ]),
  getReport: vi.fn(async (id: string) => {
    if (id === "rep-001")
      return {
        id: "rep-001",
        userId: "user-abc",
        title: "Test Report",
        assessment: "likely_authentic",
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      };
    return null;
  }),
  deleteReport: vi.fn(async (id: string, userId: string) => {
    return id === "rep-001" && userId === "user-abc";
  }),
}));

import { GET as getReports } from "@/app/api/reports/route";
import { GET as getReport, DELETE as deleteReport } from "@/app/api/reports/[id]/route";

// -- GET /api/reports --
describe("GET /api/reports", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports");
    const res = await getReports(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Unauthorized");
  });

  it("returns 401 if token is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports", {
      headers: { Authorization: "Bearer bad-token" },
    });
    const res = await getReports(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with reports array for valid token", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await getReports(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.reports)).toBe(true);
    expect(body.reports[0].id).toBe("rep-001");
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });
});

// -- GET /api/reports/[id] --
describe("GET /api/reports/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  it("returns 401 if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001");
    const res = await getReport(req, makeParams("rep-001"));
    expect(res.status).toBe(401);
  });

  it("returns 401 if token is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001", {
      headers: { Authorization: "Bearer bad-token" },
    });
    const res = await getReport(req, makeParams("rep-001"));
    expect(res.status).toBe(401);
  });

  it("returns 404 if report does not exist", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/nonexistent", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await getReport(req, makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 200 with report for valid owner", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await getReport(req, makeParams("rep-001"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.report.id).toBe("rep-001");
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });
});

// -- DELETE /api/reports/[id] --
describe("DELETE /api/reports/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  it("returns 401 if Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001", {
      method: "DELETE",
    });
    const res = await deleteReport(req, makeParams("rep-001"));
    expect(res.status).toBe(401);
  });

  it("returns 401 if token is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001", {
      method: "DELETE",
      headers: { Authorization: "Bearer bad-token" },
    });
    const res = await deleteReport(req, makeParams("rep-001"));
    expect(res.status).toBe(401);
  });

  it("returns 404 if report not found or access denied", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-999", {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await deleteReport(req, makeParams("rep-999"));
    expect(res.status).toBe(404);
  });

  it("returns 200 and deletes report for valid owner", async () => {
    const req = new NextRequest("http://localhost:3000/api/reports/rep-001", {
      method: "DELETE",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await deleteReport(req, makeParams("rep-001"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(res.headers.get("X-RateLimit-Limit")).toBeDefined();
  });
});

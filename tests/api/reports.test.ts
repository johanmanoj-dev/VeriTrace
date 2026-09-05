// tests/api/reports.test.ts
// Integration tests for /api/reports and /api/reports/[id]
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === "user1-token") return { uid: "user-1" };
      if (token === "user2-token") return { uid: "user-2" };
      throw new Error("Invalid token");
    }),
  },
  adminDb: {},
}));

vi.mock("@/lib/firestore", () => ({
  getUserReports: vi.fn(async (userId: string) => [
    { id: "rep-1", userId, title: "Report 1", assessment: "likely_authentic", confidence: 0.9 },
  ]),
  getReport: vi.fn(async (id: string) => {
    if (id === "rep-1") {
      return { id: "rep-1", userId: "user-1", title: "Report 1", assessment: "likely_authentic" };
    }
    return null;
  }),
  deleteReport: vi.fn(async (id: string, userId: string) => {
    if (id === "rep-1" && userId === "user-1") return true;
    return false;
  }),
}));

import { GET as getReports } from "@/app/api/reports/route";
import { GET as getReportDetail, DELETE as deleteReportDetail } from "@/app/api/reports/[id]/route";

describe("/api/reports integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/reports", () => {
    it("returns 401 for unauthenticated request", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports");
      const res = await getReports(req);
      expect(res.status).toBe(401);
    });

    it("returns 200 with reports array for authenticated user", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports", {
        headers: { Authorization: "Bearer user1-token" },
      });
      const res = await getReports(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reports).toHaveLength(1);
      expect(data.reports[0].id).toBe("rep-1");
    });
  });

  describe("GET /api/reports/[id]", () => {
    it("returns 404 when report does not exist", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/nonexistent", {
        headers: { Authorization: "Bearer user1-token" },
      });
      const res = await getReportDetail(req, { params: Promise.resolve({ id: "nonexistent" }) });
      expect(res.status).toBe(404);
    });

    it("returns 403 when requesting another user's report", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/rep-1", {
        headers: { Authorization: "Bearer user2-token" },
      });
      const res = await getReportDetail(req, { params: Promise.resolve({ id: "rep-1" }) });
      expect(res.status).toBe(403);
    });

    it("returns 200 when owner requests report", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/rep-1", {
        headers: { Authorization: "Bearer user1-token" },
      });
      const res = await getReportDetail(req, { params: Promise.resolve({ id: "rep-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.report.id).toBe("rep-1");
    });
  });

  describe("DELETE /api/reports/[id]", () => {
    it("returns 404/denied when non-owner tries to delete", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/rep-1", {
        method: "DELETE",
        headers: { Authorization: "Bearer user2-token" },
      });
      const res = await deleteReportDetail(req, { params: Promise.resolve({ id: "rep-1" }) });
      expect(res.status).toBe(404);
    });

    it("returns 200 when owner deletes report", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports/rep-1", {
        method: "DELETE",
        headers: { Authorization: "Bearer user1-token" },
      });
      const res = await deleteReportDetail(req, { params: Promise.resolve({ id: "rep-1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});

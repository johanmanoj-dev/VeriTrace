"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ReportsListClient } from "@/components/ReportsListClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { VerificationReport } from "@/lib/types";

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?from=/reports");
      return;
    }

    if (user) {
      user.getIdToken().then(async (token) => {
        try {
          const res = await fetch("/api/reports", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setReports(data.reports || []);
          }
        } catch (err) {
          console.error("Failed to fetch reports:", err);
        } finally {
          setFetching(false);
        }
      });
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return <ReportsListClient initialReports={reports} />;
}

import { notFound } from "next/navigation";
import { getReport } from "@/lib/firestore";
import { ReportDetailView } from "@/components/ReportDetailView";

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { reportId } = await params;
  const report = await getReport(reportId);
  return {
    title: report ? `${report.title} — VeriTrace` : "Report — VeriTrace",
    description: report?.assessmentDescription || "Media verification assessment report",
  };
}

export default async function VerifyReportPage({ params }: PageProps) {
  const { reportId } = await params;
  const report = await getReport(reportId);

  if (!report) {
    notFound();
  }

  return <ReportDetailView report={report} />;
}

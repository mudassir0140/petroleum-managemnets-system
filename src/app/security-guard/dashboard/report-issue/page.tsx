import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { IssueReportForm } from "@/components/security-guard/IssueReportForm";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { getIssueReports } from "@/lib/security-guard/activity-store";
import { simulateLatency } from "@/lib/utils";
import { formatDateTime, titleCase } from "@/lib/format";
import type { IssueStatus, IssueUrgency, SecurityIssueReport } from "@/lib/security-guard/types";

const URGENCY_TONE: Record<IssueUrgency, "good" | "warning" | "serious"> = {
  low: "good",
  medium: "warning",
  high: "serious",
};

const STATUS_TONE: Record<IssueStatus, "brand" | "warning" | "good"> = {
  open: "brand",
  acknowledged: "warning",
  resolved: "good",
};

export default async function ReportSecurityIssuePage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const reports = getIssueReports(session.guardId, 50);

  const columns: Column<SecurityIssueReport>[] = [
    { header: "Reported", cell: (row) => formatDateTime(row.reportedAt) },
    { header: "Subject", cell: (row) => <span className="font-medium">{row.subject}</span> },
    { header: "Urgency", cell: (row) => <Badge tone={URGENCY_TONE[row.urgency]}>{titleCase(row.urgency)}</Badge> },
    { header: "Status", cell: (row) => <Badge tone={STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge> },
    { header: "Details", cell: (row) => <span className="text-ink-muted">{row.description}</span> },
  ];

  return (
    <div>
      <PageHeader title="Report Security Issues" description="Flag security concerns or equipment problems to management." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="New report" />
          <IssueReportForm />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Your reports" subtitle="Every issue you've reported, most recent first" />
          <Table columns={columns} rows={reports} rowKey={(row) => row.id} emptyMessage="No issues reported yet." />
        </Card>
      </div>
    </div>
  );
}

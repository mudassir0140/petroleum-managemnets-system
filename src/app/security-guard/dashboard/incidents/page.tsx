import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { IncidentForm } from "@/components/security-guard/IncidentForm";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { getIncidents } from "@/lib/security-guard/activity-store";
import { simulateLatency } from "@/lib/utils";
import { formatDateTime, titleCase } from "@/lib/format";
import type { IncidentEntry, IncidentSeverity } from "@/lib/security-guard/types";

const SEVERITY_TONE: Record<IncidentSeverity, "good" | "warning" | "serious" | "critical"> = {
  low: "good",
  medium: "warning",
  high: "serious",
  critical: "critical",
};

export default async function IncidentsPage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const incidents = getIncidents(session.guardId, 50);

  const columns: Column<IncidentEntry>[] = [
    { header: "Reported", cell: (row) => formatDateTime(row.occurredAt) },
    { header: "Incident", cell: (row) => <span className="font-medium">{row.title}</span> },
    { header: "Location", cell: (row) => row.location || "—" },
    { header: "Severity", cell: (row) => <Badge tone={SEVERITY_TONE[row.severity]}>{titleCase(row.severity)}</Badge> },
    { header: "Description", cell: (row) => <span className="text-ink-muted">{row.description}</span> },
  ];

  return (
    <div>
      <PageHeader title="Record Incidents" description="Log any security incident at your assigned pump as soon as it happens." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="New incident" />
          <IncidentForm />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Incident history" subtitle="Every incident you've recorded, most recent first" />
          <Table columns={columns} rows={incidents} rowKey={(row) => row.id} emptyMessage="No incidents recorded yet." />
        </Card>
      </div>
    </div>
  );
}

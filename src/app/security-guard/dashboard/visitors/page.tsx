import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { VisitorForm } from "@/components/security-guard/VisitorForm";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { getVisitorsToday } from "@/lib/security-guard/activity-store";
import { checkOutVisitorAction } from "@/lib/security-guard/actions";
import { simulateLatency } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { VisitorEntry } from "@/lib/security-guard/types";

export default async function VisitorLogPage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const visitors = getVisitorsToday(session.guardId);

  const columns: Column<VisitorEntry>[] = [
    { header: "Visitor", cell: (row) => <span className="font-medium">{row.visitorName}</span> },
    { header: "Purpose", cell: (row) => <span className="text-ink-muted">{row.purpose}</span> },
    { header: "Meeting", cell: (row) => row.personToMeet || "—" },
    { header: "ID", cell: (row) => row.idNumber || "—" },
    { header: "In", cell: (row) => formatTime(row.checkedInAt) },
    {
      header: "Out",
      cell: (row) =>
        row.checkedOutAt ? (
          formatTime(row.checkedOutAt)
        ) : (
          <form action={checkOutVisitorAction}>
            <input type="hidden" name="visitorId" value={row.id} />
            <button type="submit" className="text-xs font-medium text-brand-500 hover:underline">
              Check out
            </button>
          </form>
        ),
    },
    {
      header: "Status",
      cell: (row) => <Badge tone={row.checkedOutAt ? "neutral" : "good"}>{row.checkedOutAt ? "Left" : "On site"}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Visitor Log" description="Check visitors in and out of your assigned pump." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Check in a visitor" />
          <VisitorForm />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Today's visitors" subtitle={`${visitors.length} visitor(s) logged today`} />
          <Table columns={columns} rows={visitors} rowKey={(row) => row.id} emptyMessage="No visitors checked in yet today." />
        </Card>
      </div>
    </div>
  );
}

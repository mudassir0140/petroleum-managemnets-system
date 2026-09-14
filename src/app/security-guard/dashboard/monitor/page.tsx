import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { CheckpointForm } from "@/components/security-guard/CheckpointForm";
import { IconCheck, IconShield } from "@/components/icons";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { getActiveDuty, getTodayChecks } from "@/lib/security-guard/activity-store";
import { SECURITY_CHECKPOINTS } from "@/lib/security-guard/types";
import { simulateLatency } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { SecurityCheckEntry } from "@/lib/security-guard/types";

export default async function MonitorPumpSecurityPage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const activeDuty = getActiveDuty(session.guardId);
  const todayChecks = getTodayChecks(session.guardId);

  const latestByCheckpoint = new Map<string, SecurityCheckEntry>();
  for (const check of todayChecks) {
    latestByCheckpoint.set(check.checkpoint, check);
  }

  const columns: Column<SecurityCheckEntry>[] = [
    { header: "Time", cell: (row) => formatTime(row.recordedAt) },
    { header: "Checkpoint", cell: (row) => row.checkpoint },
    { header: "Status", cell: (row) => <Badge tone={row.status === "ok" ? "good" : "critical"}>{row.status === "ok" ? "All clear" : "Issue"}</Badge> },
    { header: "Notes", cell: (row) => <span className="text-ink-muted">{row.notes || "—"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Monitor Pump Security" description="Walk the checkpoints at your pump and log each round's status." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECURITY_CHECKPOINTS.map((checkpoint) => {
          const latest = latestByCheckpoint.get(checkpoint);
          return (
            <div key={checkpoint} className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  {latest?.status === "ok" ? <IconCheck size={17} /> : <IconShield size={17} />}
                </div>
                <Badge tone={!latest ? "neutral" : latest.status === "ok" ? "good" : "critical"}>
                  {!latest ? "Not checked" : latest.status === "ok" ? "All clear" : "Issue"}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-ink-primary">{checkpoint}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {latest ? `Last checked ${formatTime(latest.recordedAt)}` : "No round logged today"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Log a checkpoint round" subtitle={activeDuty ? "Recorded against your active duty shift" : undefined} />
          <CheckpointForm onDuty={!!activeDuty} />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Today's checks" subtitle="Every round you've logged today, most recent first" />
          <Table columns={columns} rows={todayChecks} rowKey={(row) => row.id} emptyMessage="No checkpoint rounds logged today yet." />
        </Card>
      </div>
    </div>
  );
}

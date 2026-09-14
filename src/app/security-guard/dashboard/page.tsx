import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DutyControlCard } from "@/components/security-guard/DutyControlCard";
import {
  IconAlertTriangle,
  IconCar,
  IconChevronRight,
  IconFlag,
  IconShield,
  IconUsers,
} from "@/components/icons";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import {
  getActiveDuty,
  getDailyActivitySummary,
  getIncidents,
  getTodayChecks,
  getVehiclesToday,
  getVisitorsToday,
} from "@/lib/security-guard/activity-store";
import { simulateLatency } from "@/lib/utils";
import { formatTime, titleCase } from "@/lib/format";

type TimelineEntry = { time: string; label: string; detail: string; tone: "good" | "warning" | "critical" | "neutral" };

export default async function SecurityGuardOverviewPage() {
  await simulateLatency();
  const session = await getSecurityGuardSession();
  const activeDuty = getActiveDuty(session.guardId);
  const summary = getDailyActivitySummary(session.guardId);

  const today = summary.date;
  const visitors = getVisitorsToday(session.guardId);
  const vehicles = getVehiclesToday(session.guardId);
  const checks = getTodayChecks(session.guardId);
  const incidentsToday = getIncidents(session.guardId, 100).filter((i) => i.occurredAt.slice(0, 10) === today);

  const timeline: TimelineEntry[] = [
    ...visitors.map((v) => ({
      time: v.checkedInAt,
      label: `Visitor: ${v.visitorName}`,
      detail: v.purpose || "Checked in",
      tone: "neutral" as const,
    })),
    ...vehicles.map((v) => ({
      time: v.enteredAt,
      label: `Vehicle: ${v.regNumber}`,
      detail: `${titleCase(v.vehicleType)} entered${v.purpose ? ` · ${v.purpose}` : ""}`,
      tone: "neutral" as const,
    })),
    ...checks.map((c) => ({
      time: c.recordedAt,
      label: `Check: ${c.checkpoint}`,
      detail: c.status === "ok" ? "All clear" : c.notes || "Issue found",
      tone: c.status === "ok" ? ("good" as const) : ("warning" as const),
    })),
    ...incidentsToday.map((i) => ({
      time: i.occurredAt,
      label: `Incident: ${i.title}`,
      detail: titleCase(i.severity),
      tone: "critical" as const,
    })),
  ].sort((a, b) => (a.time < b.time ? 1 : -1));

  const quickLinks = [
    { href: "/security-guard/dashboard/monitor", label: "Monitor Pump Security", icon: <IconShield size={17} /> },
    { href: "/security-guard/dashboard/visitors", label: "Visitor Log", icon: <IconUsers size={17} /> },
    { href: "/security-guard/dashboard/vehicles", label: "Vehicle Entry/Exit Log", icon: <IconCar size={17} /> },
    { href: "/security-guard/dashboard/incidents", label: "Record an Incident", icon: <IconAlertTriangle size={17} /> },
    { href: "/security-guard/dashboard/report-issue", label: "Report a Security Issue", icon: <IconFlag size={17} /> },
  ];

  return (
    <div>
      <PageHeader title="Daily Security Activity" description={`Welcome back, ${session.guardName.split(" ")[0]}.`} />

      <Card className="mb-4">
        <CardHeader
          title="Your duty"
          subtitle={`Assigned shift: ${titleCase(session.assignedShift)}`}
        />
        <DutyControlCard assignedShift={session.assignedShift} activeDuty={activeDuty} summary={summary} />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Visitors on site" value={String(summary.visitorsOnSite)} hint={`${summary.visitorsIn} today`} icon={<IconUsers size={19} />} accent="var(--brand-500)" />
        <KpiCard label="Vehicles on site" value={String(summary.vehiclesOnSite)} hint={`${summary.vehiclesIn} today`} icon={<IconCar size={19} />} accent="var(--series-2)" />
        <KpiCard
          label="Checkpoint issues"
          value={String(summary.checkpointIssues)}
          hint={`${summary.checksLogged} checks today`}
          icon={<IconShield size={19} />}
          accent={summary.checkpointIssues > 0 ? "var(--status-critical)" : "var(--status-good)"}
        />
        <KpiCard
          label="Open reports"
          value={String(summary.issueReportsOpen)}
          hint={`${summary.incidentsLogged} incident(s) today`}
          icon={<IconFlag size={19} />}
          accent="var(--series-7)"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today's activity" subtitle="Visitors, vehicles, checks and incidents — most recent first" />
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Nothing logged yet today.</p>
          ) : (
            <ul className="space-y-1">
              {timeline.map((entry, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2/60">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{
                    background:
                      entry.tone === "good" ? "var(--status-good)" : entry.tone === "warning" ? "var(--status-warning)" : entry.tone === "critical" ? "var(--status-critical)" : "var(--ink-muted)",
                  }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-primary">{entry.label}</p>
                    <p className="text-xs text-ink-muted">{entry.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{formatTime(entry.time)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="space-y-1">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface-2/60 hover:text-ink-primary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                <IconChevronRight size={14} className="text-ink-muted" />
              </Link>
            ))}
          </div>
          {summary.checkpointIssues > 0 && (
            <div className="mt-3">
              <Badge tone="critical">{`${summary.checkpointIssues} checkpoint issue(s) flagged today`}</Badge>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// @ts-nocheck
"use client";

import Link from "next/link";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, CalendarIcon, ClipboardIcon, GaugeIcon } from "@/components/icons";
import { TECHNICIAN, assignedPumps, pumpLabel, type Dispenser } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const STATUS_DOT: Record<Dispenser["status"], string> = {
  Operational: "bg-emerald-500",
  "Needs Service": "bg-amber-500",
  "Under Repair": "bg-sky-500",
  "Out of Service": "bg-rose-500",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaintenanceOverviewPage() {
  const pumps = assignedPumps();
  const { dispensers, issues, repairs, tasks } = useMaintenance();

  const openIssues = issues.filter((i) => i.status !== "Resolved").length;
  const activeRepairs = repairs.filter((r) => r.status === "Pending" || r.status === "In Progress").length;
  const today = todayIso();
  const upcomingTasks = tasks.filter((t) => t.status === "Scheduled" && t.scheduledDate >= today).length;
  const needsAttention = dispensers.filter((d) => d.status !== "Operational");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${TECHNICIAN.name}`}
        description="Monitor dispenser and pump machine maintenance across your assigned stations only."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned pumps" value={String(pumps.length)} icon={GaugeIcon} hint={`${dispensers.length} dispensers`} />
        <StatCard
          label="Open issues"
          value={String(openIssues)}
          icon={AlertTriangleIcon}
          trend={openIssues > 0 ? "down" : "up"}
          delta={openIssues > 0 ? "Needs review" : "All clear"}
        />
        <StatCard label="Active repairs" value={String(activeRepairs)} icon={ClipboardIcon} />
        <StatCard label="Upcoming tasks" value={String(upcomingTasks)} icon={CalendarIcon} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Assigned pumps" description="Stations under your maintenance responsibility">
          <div className="space-y-3 p-5">
            {pumps.map((pump) => (
              <div
                key={pump.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{pump.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    Pump {pump.number} · {pump.city}
                  </p>
                </div>
                <Badge>{pump.status}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Dispensers needing attention" description="Anything not currently Operational">
          <div className="space-y-3 p-5">
            {needsAttention.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[d.status]}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {d.label} · {pumpLabel(d.pumpId)}
                    </p>
                    <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{d.fuelType}</p>
                  </div>
                </div>
                <Badge>{d.status}</Badge>
              </div>
            ))}
            {needsAttention.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Every dispenser is Operational right now.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick links">
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {[
            { href: "/dashboard/maintenance/pumps", label: "Assigned Pumps", icon: GaugeIcon },
            { href: "/dashboard/maintenance/issues", label: "Report Issue", icon: AlertTriangleIcon },
            { href: "/dashboard/maintenance/repairs", label: "Track Repairs", icon: ClipboardIcon },
            { href: "/dashboard/maintenance/schedule", label: "Schedule Task", icon: CalendarIcon },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <link.icon className="size-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

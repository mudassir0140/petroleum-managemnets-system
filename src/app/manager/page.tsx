"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClipboardIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { AlertSeverityBadge, PumpStatusBadge, TripStatusBadge } from "@/components/ops/badge";
import { PageHeader } from "@/components/ops/page-header";
import { SectionCard } from "@/components/ops/section-card";
import { StatCard } from "@/components/ops/stat-card";
import { pumpById, PUMPS } from "@/lib/data/pumps";
import { formatCurrency, formatLiters } from "@/lib/format";
import { useAlerts, useTasks } from "@/lib/store/use-tasks";
import { useTankerTrips } from "@/lib/store/use-tanker-trips";
import { useAttendance } from "@/lib/store/use-workforce";

export default function ManagerOverviewPage() {
  const { trips } = useTankerTrips();
  const { tasks } = useTasks();
  const { alerts } = useAlerts();
  const { employeesWithAttendance } = useAttendance();

  const employees = employeesWithAttendance();
  const todaysTrips = trips.filter((trip) => trip.departureTime.startsWith("Today"));
  const inTransit = trips.filter((t) => t.status === "in-transit" || t.status === "delayed");
  const delivered = todaysTrips.filter((t) => t.status === "delivered");
  const present = employees.filter((e) => e.attendance === "present").length;
  const absent = employees.filter((e) => e.attendance === "absent").length;
  const onLeave = employees.filter((e) => e.attendance === "on-leave").length;
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  const totalSalesToday = PUMPS.reduce((sum, p) => sum + p.todaySalesValue, 0);
  const totalLitersToday = PUMPS.reduce((sum, p) => sum + p.todaySalesLiters, 0);
  const openPumps = PUMPS.filter((p) => p.status === "open").length;
  const lowStockPumps = PUMPS.filter((p) => p.status === "low-stock").length;
  const closedPumps = PUMPS.filter((p) => p.status === "closed").length;

  const topPumps = [...PUMPS].sort((a, b) => b.todaySalesValue - a.todaySalesValue);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Overview"
        description="Quick daily network summary across pumps, fleet and staff — Thursday, 10 September 2026."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Today's Deliveries"
          value={`${delivered.length} / ${todaysTrips.length}`}
          hint={`${todaysTrips.length - delivered.length} still in progress`}
          icon={TruckIcon}
          tone="amber"
        />
        <StatCard
          label="Today's Network Sales"
          value={formatCurrency(totalSalesToday)}
          hint={formatLiters(totalLitersToday) + " dispensed"}
          icon={WalletIcon}
          tone="emerald"
        />
        <StatCard
          label="Tankers In Transit"
          value={String(inTransit.length)}
          hint={`${trips.filter((t) => t.status === "delayed").length} delayed`}
          icon={TruckIcon}
          tone="sky"
        />
        <StatCard
          label="Employees Present"
          value={`${present} / ${employees.length}`}
          hint={`${absent} absent · ${onLeave} on leave`}
          icon={UsersIcon}
          tone="purple"
        />
        <StatCard
          label="Pending Tasks"
          value={String(pendingTasks.length)}
          hint={`${tasks.filter((t) => t.priority === "high" && t.status !== "done").length} high priority`}
          icon={ClipboardIcon}
          tone="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Today's pump-wise sales"
          description="Ranked by collections across the network"
          className="lg:col-span-2"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Pump</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Liters</th>
                  <th className="px-5 py-3 font-medium text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topPumps.map((pump) => (
                  <tr key={pump.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{pump.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{pump.code}</p>
                    </td>
                    <td className="px-5 py-3">
                      <PumpStatusBadge status={pump.status} />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">
                      {formatLiters(pump.todaySalesLiters)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(pump.todaySalesValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Network status" description="Pump status across the region">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm dark:bg-emerald-500/10">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Open</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{openPumps}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm dark:bg-amber-500/10">
              <span className="font-medium text-amber-700 dark:text-amber-400">Low Stock</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{lowStockPumps}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm dark:bg-rose-500/10">
              <span className="font-medium text-rose-700 dark:text-rose-400">Closed</span>
              <span className="font-bold text-rose-700 dark:text-rose-400">{closedPumps}</span>
            </div>
          </div>
          <Link
            href="/manager/pumps"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            View pump operations
          </Link>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Tankers in transit"
          description="Live dispatch tracking"
          action={
            <Link
              href="/manager/tankers"
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400"
            >
              View all
            </Link>
          }
        >
          <ul className="space-y-3">
            {inTransit.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tankers currently in transit.</p>
            )}
            {inTransit.map((trip) => {
              const destination = pumpById(trip.destinationPumpId);
              return (
                <li
                  key={trip.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {trip.product} · {formatLiters(trip.quantityLiters)} → {destination?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ETA {trip.expectedArrival}
                    </p>
                  </div>
                  <TripStatusBadge status={trip.status} />
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard
          title="Active alerts"
          description="Needs your attention today"
          action={
            <Link
              href="/manager/tasks"
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400"
            >
              View all
            </Link>
          }
        >
          <ul className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <li
                key={alert.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"
              >
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <AlertSeverityBadge severity={alert.severity} />
                    <span className="text-xs text-slate-400">{alert.createdAt}</span>
                  </div>
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <CheckCircleIcon className="size-4 text-emerald-500" />
                All clear — no active alerts.
              </p>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

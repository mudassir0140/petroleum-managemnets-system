// @ts-nocheck
import { AlertTriangleIcon } from "@/components/icons";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  FUEL_MIX,
  NETWORK_STATUS,
  OVERVIEW_ALERTS,
  OVERVIEW_KPIS,
  RECENT_ACTIVITY,
  WEEKLY_REVENUE,
} from "@/lib/dashboard/data/overview";

const ALERT_TONE = {
  critical: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
} as const;

const ACTIVITY_DOT = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
} as const;

export default function DashboardOverviewPage() {
  const maxRevenue = Math.max(...WEEKLY_REVENUE.map((d) => d.value));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Real-time snapshot across every pump, the depot and the fleet."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {OVERVIEW_KPIS.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            trend={kpi.trend}
            hint={kpi.hint}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Revenue — last 7 days" className="lg:col-span-2">
          <div className="p-5">
            <div className="flex h-48 items-end gap-3">
              {WEEKLY_REVENUE.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rs. {day.value}M
                  </span>
                  <div className="flex h-32 w-full items-end overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-amber-500 to-orange-500"
                      style={{ height: `${(day.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{day.day}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Fuel mix — today
              </p>
              <div className="space-y-3">
                {FUEL_MIX.map((fuel) => (
                  <div key={fuel.fuel}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {fuel.fuel}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{fuel.percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${fuel.color}`}
                        style={{ width: `${fuel.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Alerts">
          <div className="space-y-3 p-5">
            {OVERVIEW_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-xl border p-3.5 ${ALERT_TONE[alert.severity]}`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="mt-0.5 text-xs opacity-90">{alert.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Live network status"
        description="Every pump across the network, at a glance"
      >
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {NETWORK_STATUS.map((node) => (
            <div
              key={node.pump}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{node.pump}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {node.name} · {node.city}
                </p>
              </div>
              <Badge>{node.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent activity" description="Latest events across your network">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {RECENT_ACTIVITY.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3 p-4">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${ACTIVITY_DOT[activity.tone]}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activity.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {activity.time}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

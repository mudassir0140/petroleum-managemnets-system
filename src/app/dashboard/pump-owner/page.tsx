// @ts-nocheck
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClockIcon, CreditCardIcon, GaugeIcon, TankIcon, TruckIcon, UsersIcon } from "@/components/icons";
import {
  ownerIncomingTankers,
  ownerPaymentSummary,
  ownerPump,
  ownerStaff,
  ownerTanks,
} from "@/lib/dashboard/data/pump-owner-portal";
import { pumpTodayLiters, pumpTodayRevenue } from "@/lib/dashboard/data/pumps";
import { tankPercent } from "@/lib/dashboard/data/fuel-stock";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";

export default function PumpOwnerOverviewPage() {
  const pump = ownerPump();
  const staff = ownerStaff();
  const tanks = ownerTanks();
  const upcomingTankers = ownerIncomingTankers().slice(0, 3);
  const payments = ownerPaymentSummary();

  const staffPresent = staff.filter((s) => s.week[s.week.length - 1] === "P").length;

  return (
    <div className="space-y-6">
      <PageHeader title={`${pump.name}`} description={`${pump.address}, ${pump.city}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's revenue" value={formatCurrency(pumpTodayRevenue(pump))} icon={ClockIcon} />
        <StatCard label="Today's liters" value={formatLiters(pumpTodayLiters(pump))} icon={GaugeIcon} />
        <StatCard
          label="Staff present today"
          value={`${staffPresent} / ${staff.length}`}
          icon={UsersIcon}
        />
        <StatCard
          label="Payment due to company"
          value={formatCurrency(payments.remainingDue)}
          icon={CreditCardIcon}
          tone={payments.remainingDue > 0 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Fuel stock levels">
          <div className="space-y-4 p-5">
            {tanks.map((tank) => (
              <div key={tank.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[tank.fuelType]}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{tankPercent(tank)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${tankPercent(tank)}%` }}
                  />
                </div>
              </div>
            ))}
            {tanks.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tanks configured for this pump.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming tankers" description="Next deliveries to your pump">
          <div className="space-y-3 p-5">
            {upcomingTankers.map((tanker) => (
              <div
                key={tanker.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tanker.id} · {FUEL_TYPE_LABELS[tanker.fuelType]}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tanker.driver} · ETA {tanker.expectedArrival}
                  </p>
                </div>
                <Badge>{tanker.status}</Badge>
              </div>
            ))}
            {upcomingTankers.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tankers currently inbound.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick links">
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {[
            { href: "/dashboard/pump-owner/fuel-stock", label: "Fuel Stock", icon: TankIcon },
            { href: "/dashboard/pump-owner/tankers", label: "Tankers", icon: TruckIcon },
            { href: "/dashboard/pump-owner/staff", label: "Staff", icon: UsersIcon },
            { href: "/dashboard/pump-owner/payments", label: "Payments", icon: CreditCardIcon },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <link.icon className="size-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{link.label}</span>
            </a>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

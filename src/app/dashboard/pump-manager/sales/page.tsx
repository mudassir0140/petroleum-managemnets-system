import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { managerPump } from "@/lib/dashboard/data/pump-manager-portal";
import { pumpTodayLiters, pumpTodayRevenue, pumpWeeklyTotal } from "@/lib/dashboard/data/pumps";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";

export default function PumpManagerSalesPage() {
  const pump = managerPump();
  const bestDay = Math.max(...pump.weeklyRevenue);

  return (
    <div className="space-y-6">
      <PageHeader title="Daily Sales" description="Fuel sales breakdown for your assigned pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's liters" value={formatLiters(pumpTodayLiters(pump))} />
        <StatCard label="Today's revenue" value={formatCurrency(pumpTodayRevenue(pump))} />
        <StatCard label="This week's revenue" value={formatCurrency(pumpWeeklyTotal(pump))} />
        <StatCard label="Best day this week" value={formatCurrency(bestDay)} />
      </div>

      <SectionCard title="Today's sales by fuel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pump.todaySales.map((sale) => (
                <tr key={sale.fuelType} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[sale.fuelType]}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(sale.liters)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatCurrency(sale.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Revenue — last 7 days">
        <div className="p-5">
          <div className="flex h-40 items-end gap-3">
            {pump.weeklyRevenue.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {formatCurrency(value)}
                </span>
                <div className="flex h-28 w-full items-end overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-amber-500 to-orange-500"
                    style={{ height: `${bestDay > 0 ? (value / bestDay) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

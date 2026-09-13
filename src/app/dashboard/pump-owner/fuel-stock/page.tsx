import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { tankPercent, tankStatus } from "@/lib/dashboard/data/fuel-stock";
import { ownerStockMovements, ownerTanks } from "@/lib/dashboard/data/pump-owner-portal";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import { formatLiters } from "@/lib/dashboard/format";

export default function PumpOwnerFuelStockPage() {
  const tanks = ownerTanks();
  const movements = ownerStockMovements();

  return (
    <div className="space-y-6">
      <PageHeader title="My Fuel Stock" description="Current tank levels and recent stock movements." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tanks.map((tank) => (
          <SectionCard key={tank.id} title={FUEL_TYPE_LABELS[tank.fuelType]}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {tankPercent(tank)}%
                </p>
                <Badge>{tankStatus(tank)}</Badge>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${tankPercent(tank)}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {formatLiters(tank.current)} of {formatLiters(tank.capacity)} capacity · Reorder below{" "}
                {formatLiters(tank.reorderThreshold)}
              </p>
            </div>
          </SectionCard>
        ))}
        {tanks.length === 0 && (
          <SectionCard>
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No tanks configured for this pump.</p>
          </SectionCard>
        )}
      </div>

      <SectionCard title="Stock movement history">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{movement.date}</td>
                  <td className="px-5 py-3">
                    <Badge>{movement.type}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[movement.fuelType]}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatLiters(movement.liters)}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No recent stock movements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// @ts-nocheck
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ownerIncomingTankers } from "@/lib/dashboard/data/pump-owner-portal";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import { formatLiters } from "@/lib/dashboard/format";

export default function PumpOwnerTankersPage() {
  const tankers = ownerIncomingTankers();
  const delayed = tankers.filter((t) => t.status === "In Transit" && t.progress < 30).length;
  const incomingLiters = tankers.reduce((sum, t) => sum + t.capacity, 0);
  const next = tankers[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Incoming Tankers" description="Fuel deliveries scheduled for your pump." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Next arrival" value={next ? next.expectedArrival : "—"} />
        <StatCard label="Incoming liters" value={formatLiters(incomingLiters)} />
        <StatCard label="Delayed" value={String(delayed)} trend={delayed > 0 ? "down" : undefined} />
      </div>

      <SectionCard title="Delivery board">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Tanker</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Capacity</th>
                <th className="px-5 py-3 font-medium">ETA</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tankers.map((tanker) => (
                <tr key={tanker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{tanker.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tanker.driver}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {FUEL_TYPE_LABELS[tanker.fuelType]}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(tanker.capacity)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{tanker.expectedArrival}</td>
                  <td className="px-5 py-3">
                    <Badge>{tanker.status}</Badge>
                  </td>
                </tr>
              ))}
              {tankers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tankers currently inbound.
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

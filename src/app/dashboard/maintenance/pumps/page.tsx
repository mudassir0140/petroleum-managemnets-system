"use client";

import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { assignedPumps, type DispenserStatus } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const NEXT_STATUS: Record<DispenserStatus, DispenserStatus> = {
  Operational: "Needs Service",
  "Needs Service": "Under Repair",
  "Under Repair": "Out of Service",
  "Out of Service": "Operational",
};

export default function MaintenanceAssignedPumpsPage() {
  const pumps = assignedPumps();
  const { dispensers, updateDispenserStatus } = useMaintenance();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Pumps"
        description="Pumps and dispensers under your maintenance responsibility. Click a status pill to update it."
      />

      {pumps.map((pump) => {
        const pumpDispensers = dispensers.filter((d) => d.pumpId === pump.id);

        return (
          <SectionCard
            key={pump.id}
            title={`${pump.name} · Pump ${pump.number}`}
            description={`${pump.address}, ${pump.city}`}
            actions={<Badge>{pump.status}</Badge>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-5 py-3 font-medium">Dispenser</th>
                    <th className="px-5 py-3 font-medium">Fuel</th>
                    <th className="px-5 py-3 font-medium">Last serviced</th>
                    <th className="px-5 py-3 font-medium">Next service due</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pumpDispensers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.label}</td>
                      <td className="px-5 py-3 capitalize text-slate-600 dark:text-slate-300">{d.fuelType}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.lastServicedOn}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.nextServiceDue}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => updateDispenserStatus(d.id, NEXT_STATUS[d.status])}
                          aria-label={`Cycle status for ${d.label}`}
                          className="cursor-pointer"
                        >
                          <Badge>{d.status}</Badge>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pumpDispensers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No dispensers recorded for this pump.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

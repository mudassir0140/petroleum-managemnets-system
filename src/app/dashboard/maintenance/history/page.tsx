"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClipboardIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { assignedPumps, pumpLabel } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const STATUSES = ["Completed", "Cancelled"];

export default function MaintenanceHistoryPage() {
  const pumps = assignedPumps();
  const { dispensers, repairs } = useMaintenance();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [pump, setPump] = useState("All");

  const history = useMemo(
    () => repairs.filter((r) => r.status === "Completed" || r.status === "Cancelled"),
    [repairs],
  );

  const filtered = useMemo(() => {
    return history.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || r.status === status;
      const matchesPump = pump === "All" || r.pumpId === pump;
      return matchesSearch && matchesStatus && matchesPump;
    });
  }, [history, search, status, pump]);

  const completedCount = history.filter((r) => r.status === "Completed").length;
  const cancelledCount = history.filter((r) => r.status === "Cancelled").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Repair History" description="Every completed or cancelled repair across your assigned pumps." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Completed repairs" value={String(completedCount)} icon={ClipboardIcon} trend="up" delta="All time" />
        <StatCard label="Cancelled repairs" value={String(cancelledCount)} />
      </div>

      <SectionCard
        title="Repair history"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv(
                "maintenance-repair-history",
                filtered.map((r) => ({
                  ID: r.id,
                  Pump: pumpLabel(r.pumpId),
                  Dispenser: dispensers.find((d) => d.id === r.dispenserId)?.label ?? "—",
                  Title: r.title,
                  Status: r.status,
                  Started: r.startedOn,
                  Completed: r.completedOn ?? "—",
                  Notes: r.notes,
                })),
              )
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search title or repair ID…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
          <FilterSelect value={pump} onChange={setPump} options={pumps.map((p) => p.id)} label="Pump" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Repair</th>
                <th className="px-5 py-3 font-medium">Pump / Dispenser</th>
                <th className="px-5 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Completed</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.id}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {pumpLabel(r.pumpId)}
                    {r.dispenserId && <span className="block text-xs text-slate-400">{dispensers.find((d) => d.id === r.dispenserId)?.label}</span>}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-slate-600 dark:text-slate-300">{r.notes || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.startedOn}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.completedOn ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Badge>{r.status}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No repair history matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {history.length} records
        </p>
      </SectionCard>
    </div>
  );
}

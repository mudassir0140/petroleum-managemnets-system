// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, TrendingUpIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency, formatCurrencyCompact } from "@/lib/dashboard/format";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import { SALES_TARGETS, type SalesTarget } from "@/lib/dashboard/data/sales";

const PUMP_FILTERS = PUMPS.map((p) => `Pump ${p.number}`);

type TargetFormState = {
  pumpNumber: number;
  pumpName: string;
  salesperson: string;
  month: string;
  target: string;
  achieved: string;
};

function emptyForm(): TargetFormState {
  const firstPump = PUMPS[0];
  return {
    pumpNumber: firstPump?.number || 0,
    pumpName: firstPump?.name || "",
    salesperson: "",
    month: "September 2026",
    target: "",
    achieved: "",
  };
}

function formFromTarget(t: SalesTarget): TargetFormState {
  return {
    pumpNumber: t.pumpNumber,
    pumpName: t.pumpName,
    salesperson: t.salesperson,
    month: t.month,
    target: String(t.target),
    achieved: String(t.achieved),
  };
}

function achievementTone(pct: number): "success" | "warning" | "danger" {
  if (pct >= 100) return "success";
  if (pct >= 70) return "warning";
  return "danger";
}

export default function SalesPerformancePage() {
  const [targets, setTargets] = useState<SalesTarget[]>(SALES_TARGETS);
  const [search, setSearch] = useState("");
  const [pumpFilter, setPumpFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TargetFormState>(emptyForm());

  const filtered = useMemo(() => {
    return targets.filter((t) => {
      const matchesSearch =
        t.salesperson.toLowerCase().includes(search.toLowerCase()) ||
        t.pumpName.toLowerCase().includes(search.toLowerCase());
      const matchesPump = pumpFilter === "All" || `Pump ${t.pumpNumber}` === pumpFilter;
      return matchesSearch && matchesPump;
    });
  }, [targets, search, pumpFilter]);

  const totalTarget = targets.reduce((sum, t) => sum + t.target, 0);
  const totalAchieved = targets.reduce((sum, t) => sum + t.achieved, 0);
  const achievementPct = totalTarget === 0 ? 0 : (totalAchieved / totalTarget) * 100;
  const topPerformer = targets
    .slice()
    .sort((a, b) => b.achieved / b.target - a.achieved / a.target)[0];
  const maxValue = Math.max(...targets.flatMap((t) => [t.target, t.achieved]), 1);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(target: SalesTarget) {
    setForm(formFromTarget(target));
    setEditingId(target.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = Number(form.target) || 0;
    const achieved = Number(form.achieved) || 0;
    if (target <= 0 || !form.salesperson.trim()) return;
    const pump = PUMPS.find((p) => p.number === form.pumpNumber) ?? PUMPS[0];

    if (editingId) {
      setTargets((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                pumpNumber: pump.number,
                pumpName: pump.name,
                salesperson: form.salesperson.trim(),
                month: form.month.trim() || t.month,
                target,
                achieved,
              }
            : t,
        ),
      );
    } else {
      const nextNumber = targets.length + 1;
      const newTarget: SalesTarget = {
        id: `TGT-${String(nextNumber).padStart(2, "0")}`,
        pumpNumber: pump.number,
        pumpName: pump.name,
        salesperson: form.salesperson.trim(),
        month: form.month.trim() || "September 2026",
        target,
        achieved,
      };
      setTargets((prev) => [...prev, newTarget]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Performance"
        description="Target vs. achieved sales per pump and salesperson."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Target
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total target" value={formatCurrencyCompact(totalTarget)} icon={TrendingUpIcon} />
        <StatCard label="Total achieved" value={formatCurrencyCompact(totalAchieved)} trend={achievementPct >= 100 ? "up" : "down"} delta={`${achievementPct.toFixed(1)}% of target`} />
        <StatCard label="Top performer" value={topPerformer?.salesperson ?? "—"} icon={UsersIcon} hint={topPerformer ? `Pump ${topPerformer.pumpNumber}` : undefined} />
        <StatCard label="Pumps tracked" value={String(targets.length)} hint="This month" />
      </div>

      <SectionCard title="Target vs. achieved — this month">
        <div className="p-5">
          <div className="flex h-52 items-end gap-4">
            {targets.map((t) => (
              <div key={t.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-40 w-full items-end gap-1">
                  <div
                    className="flex-1 rounded-t-md bg-slate-300 dark:bg-slate-700"
                    style={{ height: `${(t.target / maxValue) * 100}%` }}
                    title={`Target ${formatCurrency(t.target)}`}
                  />
                  <div
                    className={`flex-1 rounded-t-md ${t.achieved >= t.target ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ height: `${(t.achieved / maxValue) * 100}%` }}
                    title={`Achieved ${formatCurrency(t.achieved)}`}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Pump {t.pumpNumber}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300 dark:bg-slate-700" />Target</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Achieved (met)</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Achieved (below target)</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Performance by pump"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("sales-performance", filtered.map((t) => ({
                Pump: `Pump ${t.pumpNumber}`,
                Salesperson: t.salesperson,
                Month: t.month,
                "Target (Rs.)": t.target,
                "Achieved (Rs.)": t.achieved,
                "Achievement %": ((t.achieved / t.target) * 100).toFixed(1),
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search salesperson or pump…" />
          <FilterSelect value={pumpFilter} onChange={setPumpFilter} options={PUMP_FILTERS} label="Pump" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Salesperson</th>
                <th className="px-5 py-3 font-medium">Month</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Achieved</th>
                <th className="px-5 py-3 font-medium">Achievement</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((t) => {
                const pct = t.target === 0 ? 0 : (t.achieved / t.target) * 100;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">Pump {t.pumpNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.pumpName}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.salesperson}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.month}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(t.target)}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(t.achieved)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={achievementTone(pct)}>{pct.toFixed(1)}%</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        aria-label={`Edit ${t.salesperson}'s target`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="size-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No performance records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {targets.length} records
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Target" : "Add Target"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
                <select
                  value={form.pumpNumber}
                  onChange={(e) => setForm((f) => ({ ...f, pumpNumber: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PUMPS.map((p) => (
                    <option key={p.id} value={p.number}>
                      Pump {p.number} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Month</label>
                <input
                  required
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                  placeholder="e.g. September 2026"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Salesperson</label>
              <input
                required
                value={form.salesperson}
                onChange={(e) => setForm((f) => ({ ...f, salesperson: e.target.value }))}
                placeholder="e.g. Saima Yousaf"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Target (Rs.)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder="e.g. 75000000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Achieved (Rs.)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.achieved}
                  onChange={(e) => setForm((f) => ({ ...f, achieved: e.target.value }))}
                  placeholder="e.g. 68500000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Target"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

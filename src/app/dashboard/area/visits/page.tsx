// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartBarIcon, ClipboardIcon, EditIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import { CITIES } from "@/lib/dashboard/data/stations";
import {
  PUMP_VISITS,
  type PumpVisit,
  type VisitFollowUp,
  type VisitPurpose,
} from "@/lib/dashboard/data/area";

const PURPOSES: VisitPurpose[] = ["Routine Check", "Performance Review", "Complaint Follow-up", "Audit"];
const FOLLOW_UPS: VisitFollowUp[] = ["None", "Pending", "Resolved"];
const CITY_FILTERS = [...CITIES];

const FOLLOW_UP_TONE: Record<VisitFollowUp, BadgeTone> = {
  None: "neutral",
  Pending: "warning",
  Resolved: "success",
};

type VisitFormState = {
  pumpNumber: number;
  date: string;
  areaManager: string;
  purpose: VisitPurpose;
  rating: string;
  findings: string;
  followUp: VisitFollowUp;
};

function emptyForm(): VisitFormState {
  return {
    pumpNumber: PUMPS[0].number,
    date: new Date().toISOString().slice(0, 10),
    areaManager: "",
    purpose: "Routine Check",
    rating: "4",
    findings: "",
    followUp: "None",
  };
}

function formFromVisit(v: PumpVisit): VisitFormState {
  return {
    pumpNumber: v.pumpNumber,
    date: v.date,
    areaManager: v.areaManager,
    purpose: v.purpose,
    rating: String(v.rating),
    findings: v.findings,
    followUp: v.followUp,
  };
}

export default function PumpVisitsPage() {
  const [visits, setVisits] = useState<PumpVisit[]>(PUMP_VISITS);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [followUpFilter, setFollowUpFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VisitFormState>(emptyForm());

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      const matchesSearch =
        v.pumpName.toLowerCase().includes(search.toLowerCase()) ||
        v.areaManager.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === "All" || v.city === cityFilter;
      const matchesFollowUp = followUpFilter === "All" || v.followUp === followUpFilter;
      return matchesSearch && matchesCity && matchesFollowUp;
    });
  }, [visits, search, cityFilter, followUpFilter]);

  const avgRating = visits.length === 0 ? 0 : visits.reduce((sum, v) => sum + v.rating, 0) / visits.length;
  const pendingFollowUps = visits.filter((v) => v.followUp === "Pending").length;
  const thisMonthVisits = visits.filter((v) => v.date.startsWith("2026-09")).length;

  const ratingByPump = useMemo(() => {
    const map = new Map<number, { pumpNumber: number; pumpName: string; total: number; count: number }>();
    for (const v of visits) {
      const entry = map.get(v.pumpNumber) ?? { pumpNumber: v.pumpNumber, pumpName: v.pumpName, total: 0, count: 0 };
      entry.total += v.rating;
      entry.count += 1;
      map.set(v.pumpNumber, entry);
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, avg: e.total / e.count }))
      .sort((a, b) => a.pumpNumber - b.pumpNumber);
  }, [visits]);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(visit: PumpVisit) {
    setForm(formFromVisit(visit));
    setEditingId(visit.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const rating = Math.min(5, Math.max(1, Number(form.rating) || 0));
    if (!form.areaManager.trim() || !form.findings.trim()) return;
    const pump = PUMPS.find((p) => p.number === form.pumpNumber) ?? PUMPS[0];

    if (editingId) {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? {
                ...v,
                pumpNumber: pump.number,
                pumpName: pump.name,
                city: pump.city,
                date: form.date,
                areaManager: form.areaManager.trim(),
                purpose: form.purpose,
                rating,
                findings: form.findings.trim(),
                followUp: form.followUp,
              }
            : v,
        ),
      );
    } else {
      const nextNumber = visits.length + 201;
      const newVisit: PumpVisit = {
        id: `VIS-${nextNumber}`,
        pumpNumber: pump.number,
        pumpName: pump.name,
        city: pump.city,
        date: form.date,
        areaManager: form.areaManager.trim(),
        purpose: form.purpose,
        rating,
        findings: form.findings.trim(),
        followUp: form.followUp,
      };
      setVisits((prev) => [newVisit, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Visits & Performance Monitoring"
        description="Site visits, ratings and follow-up tracking across your assigned pumps."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Visit
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visits logged" value={String(visits.length)} icon={ClipboardIcon} hint={`${thisMonthVisits} this month`} />
        <StatCard label="Average rating" value={`${avgRating.toFixed(1)} / 5`} icon={ChartBarIcon} />
        <StatCard label="Pending follow-ups" value={String(pendingFollowUps)} trend={pendingFollowUps > 0 ? "down" : "up"} delta={pendingFollowUps > 0 ? "Needs action" : "All clear"} />
        <StatCard label="Pumps visited" value={String(ratingByPump.length)} hint={`of ${PUMPS.length} assigned`} />
      </div>

      <SectionCard title="Average rating by pump">
        <div className="p-5">
          <div className="flex h-44 items-end gap-4">
            {ratingByPump.map((r) => (
              <div key={r.pumpNumber} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end">
                  <div
                    className={`w-full rounded-t-md ${r.avg >= 4 ? "bg-emerald-500" : r.avg >= 3 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ height: `${(r.avg / 5) * 100}%` }}
                    title={`${r.avg.toFixed(1)} / 5`}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Pump {r.pumpNumber}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Visit log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pump-visits", filtered.map((v) => ({
                ID: v.id, Pump: `Pump ${v.pumpNumber}`, City: v.city, Date: v.date, "Area Manager": v.areaManager,
                Purpose: v.purpose, Rating: v.rating, Findings: v.findings, "Follow-up": v.followUp,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search pump, manager or ID…" />
          <FilterSelect value={cityFilter} onChange={setCityFilter} options={CITY_FILTERS} label="City" />
          <FilterSelect value={followUpFilter} onChange={setFollowUpFilter} options={FOLLOW_UPS} label="Follow-up" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Visit</th>
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Purpose</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Follow-up</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{v.id}</p>
                    <p className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400" title={v.findings}>{v.findings}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">Pump {v.pumpNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.city} · {v.areaManager}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{v.date}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{v.purpose}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{v.rating} / 5</td>
                  <td className="px-5 py-3">
                    <Badge tone={FOLLOW_UP_TONE[v.followUp]}>{v.followUp}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      aria-label={`Edit ${v.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No visits match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {visits.length} visits
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Visit" : "Log Visit"} onClose={() => setShowAdd(false)}>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Area manager</label>
              <input
                required
                value={form.areaManager}
                onChange={(e) => setForm((f) => ({ ...f, areaManager: e.target.value }))}
                placeholder="e.g. Tariq Naveed"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Purpose</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value as VisitPurpose }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Rating (1-5)</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Follow-up</label>
                <select
                  value={form.followUp}
                  onChange={(e) => setForm((f) => ({ ...f, followUp: e.target.value as VisitFollowUp }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {FOLLOW_UPS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Findings</label>
              <textarea
                required
                rows={3}
                value={form.findings}
                onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))}
                placeholder="What did you observe during this visit?"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Log Visit"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

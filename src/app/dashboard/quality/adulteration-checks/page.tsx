// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, EditIcon, PlusIcon, ShieldCheckIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  ADULTERATION_CHECKS,
  ADULTERATION_METHODS,
  QC_LOCATIONS,
  checkLocationType,
  type AdulterationCheck,
  type AdulterationMethod,
  type AdulterationVerdict,
  type QCLocation,
} from "@/lib/dashboard/data/quality-control";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const VERDICTS: AdulterationVerdict[] = ["Clean", "Suspected", "Confirmed"];
const LOCATION_TYPES = ["Depot", "Pump"];

const VERDICT_TONE: Record<AdulterationVerdict, BadgeTone> = {
  Clean: "success",
  Suspected: "warning",
  Confirmed: "danger",
};

type CheckFormState = {
  location: QCLocation;
  fuelType: FuelType;
  method: AdulterationMethod;
  adulterationLevel: string;
  verdict: AdulterationVerdict;
  actionTaken: string;
  checkedBy: string;
  checkedAt: string;
};

function emptyForm(): CheckFormState {
  return {
    location: QC_LOCATIONS[0],
    fuelType: "petrol",
    method: "Density Test",
    adulterationLevel: "0",
    verdict: "Clean",
    actionTaken: "",
    checkedBy: "",
    checkedAt: new Date().toISOString().slice(0, 10),
  };
}

function formFromCheck(check: AdulterationCheck): CheckFormState {
  return {
    location: (check.location as QCLocation) || QC_LOCATIONS[0],
    fuelType: (check.fuelType as FuelType) || "petrol",
    method: check.method,
    adulterationLevel: String(check.adulterationLevel),
    verdict: (check.verdict as AdulterationVerdict) || "Clean",
    actionTaken: check.actionTaken,
    checkedBy: check.checkedBy,
    checkedAt: check.checkedAt,
  };
}

export default function AdulterationChecksPage() {
  const [checks, setChecks] = useState<AdulterationCheck[]>(ADULTERATION_CHECKS);
  const [search, setSearch] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("All");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("All");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CheckFormState>(emptyForm());

  const filtered = useMemo(() => {
    return checks.filter((c) => {
      const matchesSearch =
        c.location.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.method.toLowerCase().includes(search.toLowerCase());
      const matchesLocationType = locationTypeFilter === "All" || checkLocationType(c) === locationTypeFilter;
      const matchesFuelType = fuelTypeFilter === "All" || FUEL_TYPE_LABELS[c.fuelType as FuelType] === fuelTypeFilter;
      const matchesVerdict = verdictFilter === "All" || c.verdict === verdictFilter;
      return matchesSearch && matchesLocationType && matchesFuelType && matchesVerdict;
    });
  }, [checks, search, locationTypeFilter, fuelTypeFilter, verdictFilter]);

  const totalChecks = checks.length;
  const clean = checks.filter((c) => c.verdict === "Clean").length;
  const suspected = checks.filter((c) => c.verdict === "Suspected").length;
  const confirmed = checks.filter((c) => c.verdict === "Confirmed").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(check: AdulterationCheck) {
    setForm(formFromCheck(check));
    setEditingId(check.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.checkedBy.trim()) return;
    const adulterationLevel = Math.max(0, Math.min(100, Number(form.adulterationLevel) || 0));

    if (editingId) {
      setChecks((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                location: form.location,
                fuelType: form.fuelType,
                method: form.method,
                adulterationLevel: String(adulterationLevel),
                verdict: form.verdict,
                actionTaken: form.actionTaken.trim(),
                checkedBy: form.checkedBy.trim(),
                checkedAt: form.checkedAt,
              }
            : c,
        ),
      );
    } else {
      const newCheck: AdulterationCheck = {
        id: `AC-${200 + checks.length + 1}`,
        location: form.location,
        fuelType: form.fuelType,
        method: form.method,
        adulterationLevel: String(adulterationLevel),
        verdict: form.verdict,
        actionTaken: form.actionTaken.trim(),
        checkedBy: form.checkedBy.trim(),
        checkedAt: form.checkedAt,
      };
      setChecks((prev) => [newCheck, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adulteration Checks"
        description="Density, filter paper, marker/dye and distillation checks used to catch fuel adulteration."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Check
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Checks logged" value={String(totalChecks)} icon={ShieldCheckIcon} />
        <StatCard label="Clean" value={String(clean)} trend="up" delta="No adulteration" />
        <StatCard label="Suspected" value={String(suspected)} icon={AlertTriangleIcon} tone="amber" trend={suspected > 0 ? "down" : "up"} delta={suspected > 0 ? "Awaiting confirmation" : "None pending"} />
        <StatCard label="Confirmed" value={String(confirmed)} tone="rose" trend={confirmed > 0 ? "down" : "up"} delta={confirmed > 0 ? "Action required" : "None found"} />
      </div>

      <SectionCard
        title="Adulteration check log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("adulteration-checks", filtered.map((c) => ({
                Check: c.id,
                Location: c.location,
                "Location Type": checkLocationType(c),
                "Fuel Type": FUEL_TYPE_LABELS[c.fuelType as FuelType] || c.fuelType,
                Method: c.method,
                "Adulteration Level (%)": c.adulterationLevel,
                Verdict: c.verdict,
                "Action Taken": c.actionTaken,
                "Checked By": c.checkedBy,
                "Checked At": c.checkedAt,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search location, check ID or method…" />
          <FilterSelect value={locationTypeFilter} onChange={setLocationTypeFilter} options={LOCATION_TYPES} label="Location" />
          <FilterSelect
            value={fuelTypeFilter}
            onChange={setFuelTypeFilter}
            options={FUEL_TYPES.map((f) => FUEL_TYPE_LABELS[f])}
            label="Fuel Type"
          />
          <FilterSelect value={verdictFilter} onChange={setVerdictFilter} options={VERDICTS} label="Verdict" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Check</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Verdict</th>
                <th className="px-5 py-3 font-medium">Action taken</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{c.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.checkedAt} · {c.checkedBy}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{c.location}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{FUEL_TYPE_LABELS[c.fuelType as FuelType] || c.fuelType} · {checkLocationType(c)}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{c.method}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{c.adulterationLevel}%</td>
                  <td className="px-5 py-3">
                    <Badge tone={VERDICT_TONE[c.verdict as AdulterationVerdict] || "neutral"}>{c.verdict}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <p className="max-w-xs truncate text-slate-600 dark:text-slate-300" title={c.actionTaken}>{c.actionTaken || "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.id}`}
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
                    No checks match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {checks.length} checks
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Adulteration Check" : "Log Adulteration Check"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value as QCLocation }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {QC_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel type</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as AdulterationMethod }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {ADULTERATION_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Adulteration level (%)</label>
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  value={form.adulterationLevel}
                  onChange={(e) => setForm((f) => ({ ...f, adulterationLevel: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Verdict</label>
                <select
                  value={form.verdict}
                  onChange={(e) => setForm((f) => ({ ...f, verdict: e.target.value as AdulterationVerdict }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {VERDICTS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Checked by</label>
              <input
                required
                value={form.checkedBy}
                onChange={(e) => setForm((f) => ({ ...f, checkedBy: e.target.value }))}
                placeholder="e.g. Bilal Aslam"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Check date</label>
              <input
                required
                type="date"
                value={form.checkedAt}
                onChange={(e) => setForm((f) => ({ ...f, checkedAt: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Action taken</label>
              <textarea
                rows={2}
                value={form.actionTaken}
                onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
                placeholder="e.g. Sample sent to lab for confirmation"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Log Check"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

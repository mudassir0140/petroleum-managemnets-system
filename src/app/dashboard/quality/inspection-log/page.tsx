// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, ClipboardIcon, EditIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  INSPECTION_LOG,
  INSPECTION_SEVERITIES,
  INSPECTION_SOURCES,
  INSPECTION_STATUSES,
  QC_LOCATIONS,
  inspectionLocationType,
  type InspectionLogEntry,
  type InspectionSeverity,
  type InspectionSource,
  type InspectionStatus,
  type QCLocation,
} from "@/lib/dashboard/data/quality-control";

const LOCATION_TYPES = ["Depot", "Pump"];

const SEVERITY_TONE: Record<InspectionSeverity, BadgeTone> = {
  Low: "neutral",
  Medium: "warning",
  High: "danger",
  Critical: "danger",
};

const STATUS_TONE: Record<InspectionStatus, BadgeTone> = {
  Open: "warning",
  "Under Review": "info",
  Resolved: "success",
};

type LogFormState = {
  location: QCLocation;
  source: InspectionSource;
  referenceId: string;
  summary: string;
  severity: InspectionSeverity;
  status: InspectionStatus;
  inspector: string;
  inspectedAt: string;
  followUpDate: string;
};

function emptyForm(): LogFormState {
  return {
    location: QC_LOCATIONS[0],
    source: "Routine Inspection",
    referenceId: "",
    summary: "",
    severity: "Low",
    status: "Open",
    inspector: "",
    inspectedAt: new Date().toISOString().slice(0, 10),
    followUpDate: "",
  };
}

function formFromEntry(entry: InspectionLogEntry): LogFormState {
  return {
    location: (entry.location as QCLocation) || QC_LOCATIONS[0],
    source: entry.source,
    referenceId: entry.referenceId ?? "",
    summary: entry.summary,
    severity: entry.severity,
    status: entry.status,
    inspector: entry.inspector,
    inspectedAt: entry.inspectedAt,
    followUpDate: entry.followUpDate ?? "",
  };
}

export default function InspectionLogPage() {
  const [entries, setEntries] = useState<InspectionLogEntry[]>(INSPECTION_LOG);
  const [search, setSearch] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LogFormState>(emptyForm());

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        e.summary.toLowerCase().includes(search.toLowerCase());
      const matchesLocationType = locationTypeFilter === "All" || inspectionLocationType(e) === locationTypeFilter;
      const matchesSeverity = severityFilter === "All" || e.severity === severityFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesSearch && matchesLocationType && matchesSeverity && matchesStatus;
    });
  }, [entries, search, locationTypeFilter, severityFilter, statusFilter]);

  const totalEntries = entries.length;
  const openCount = entries.filter((e) => e.status === "Open").length;
  const underReview = entries.filter((e) => e.status === "Under Review").length;
  const highPriority = entries.filter((e) => e.severity === "High" || e.severity === "Critical").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(entry: InspectionLogEntry) {
    setForm(formFromEntry(entry));
    setEditingId(entry.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.summary.trim() || !form.inspector.trim()) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                location: form.location,
                source: form.source,
                referenceId: form.referenceId.trim() || null,
                summary: form.summary.trim(),
                severity: form.severity,
                status: form.status,
                inspector: form.inspector.trim(),
                inspectedAt: form.inspectedAt,
                followUpDate: form.followUpDate || null,
              }
            : e,
        ),
      );
    } else {
      const newEntry: InspectionLogEntry = {
        id: `IL-${300 + entries.length + 1}`,
        location: form.location,
        source: form.source,
        referenceId: form.referenceId.trim() || null,
        summary: form.summary.trim(),
        severity: form.severity,
        status: form.status,
        inspector: form.inspector.trim(),
        inspectedAt: form.inspectedAt,
        followUpDate: form.followUpDate || null,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Inspection Results"
        description="Consolidated findings from quality tests, adulteration checks and routine inspections, with follow-up tracking."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Log Result
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Log entries" value={String(totalEntries)} icon={ClipboardIcon} />
        <StatCard label="Open" value={String(openCount)} trend={openCount > 0 ? "down" : "up"} delta={openCount > 0 ? "Needs action" : "All clear"} />
        <StatCard label="Under review" value={String(underReview)} />
        <StatCard label="High/Critical" value={String(highPriority)} icon={AlertTriangleIcon} tone="rose" trend={highPriority > 0 ? "down" : "up"} delta={highPriority > 0 ? "Priority follow-up" : "None pending"} />
      </div>

      <SectionCard
        title="Inspection results log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("inspection-log", filtered.map((e) => ({
                Log: e.id,
                Location: e.location,
                "Location Type": inspectionLocationType(e),
                Source: e.source,
                Reference: e.referenceId ?? "",
                Summary: e.summary,
                Severity: e.severity,
                Status: e.status,
                Inspector: e.inspector,
                "Inspected At": e.inspectedAt,
                "Follow-up Date": e.followUpDate ?? "",
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search location, log ID or summary…" />
          <FilterSelect value={locationTypeFilter} onChange={setLocationTypeFilter} options={LOCATION_TYPES} label="Location" />
          <FilterSelect value={severityFilter} onChange={setSeverityFilter} options={INSPECTION_SEVERITIES} label="Severity" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={INSPECTION_STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Log</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Summary</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Follow-up</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{e.id}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {e.source}{e.referenceId ? ` · ${e.referenceId}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">{e.location}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.inspector} · {e.inspectedAt}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="max-w-xs truncate text-slate-600 dark:text-slate-300" title={e.summary}>{e.summary}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.followUpDate ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      aria-label={`Edit ${e.id}`}
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
                    No log entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {entries.length} entries
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Log Entry" : "Log Inspection Result"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as InspectionSource }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {INSPECTION_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reference ID (optional)</label>
              <input
                value={form.referenceId}
                onChange={(e) => setForm((f) => ({ ...f, referenceId: e.target.value }))}
                placeholder="e.g. QT-104 or AC-202"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Summary</label>
              <textarea
                required
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Describe the finding"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as InspectionSeverity }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {INSPECTION_SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InspectionStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {INSPECTION_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Inspector</label>
              <input
                required
                value={form.inspector}
                onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
                placeholder="e.g. Rabia Sheikh"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Inspected date</label>
                <input
                  required
                  type="date"
                  value={form.inspectedAt}
                  onChange={(e) => setForm((f) => ({ ...f, inspectedAt: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Follow-up date (optional)</label>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Log Result"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

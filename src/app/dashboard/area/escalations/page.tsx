// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, EditIcon, PlusIcon, TrendingUpIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import {
  ESCALATIONS,
  type Escalation,
  type EscalationSeverity,
  type EscalationStatus,
  type EscalationType,
} from "@/lib/dashboard/data/area";

const TYPES: EscalationType[] = ["Low Sales", "Payment Delay", "Complaint"];
const SEVERITIES: EscalationSeverity[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: EscalationStatus[] = ["Open", "Investigating", "Escalated", "Resolved"];

const SEVERITY_TONE: Record<EscalationSeverity, BadgeTone> = {
  Low: "neutral",
  Medium: "warning",
  High: "danger",
  Critical: "danger",
};

const STATUS_TONE: Record<EscalationStatus, BadgeTone> = {
  Open: "warning",
  Investigating: "info",
  Escalated: "danger",
  Resolved: "success",
};

type EscalationFormState = {
  pumpNumber: number;
  type: EscalationType;
  severity: EscalationSeverity;
  description: string;
  raisedDate: string;
  status: EscalationStatus;
  assignedTo: string;
};

function emptyForm(): EscalationFormState {
  return {
    pumpNumber: PUMPS[0]?.number ?? 0,
    type: "Low Sales",
    severity: "Medium",
    description: "",
    raisedDate: new Date().toISOString().slice(0, 10),
    status: "Open",
    assignedTo: "",
  };
}

function formFromEscalation(e: Escalation): EscalationFormState {
  return {
    pumpNumber: e.pumpNumber,
    type: e.type,
    severity: e.severity,
    description: e.description,
    raisedDate: e.raisedDate,
    status: e.status,
    assignedTo: e.assignedTo,
  };
}

export default function IssueEscalationPage() {
  const [escalations, setEscalations] = useState<Escalation[]>(ESCALATIONS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EscalationFormState>(emptyForm());

  const filtered = useMemo(() => {
    return escalations.filter((e) => {
      const matchesSearch =
        e.pumpName.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesSeverity = severityFilter === "All" || e.severity === severityFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
    });
  }, [escalations, search, typeFilter, severityFilter, statusFilter]);

  const openCount = escalations.filter((e) => e.status === "Open" || e.status === "Investigating" || e.status === "Escalated").length;
  const criticalCount = escalations.filter((e) => e.severity === "Critical").length;
  const lowSalesCount = escalations.filter((e) => e.type === "Low Sales").length;
  const resolvedCount = escalations.filter((e) => e.status === "Resolved").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(escalation: Escalation) {
    setForm(formFromEscalation(escalation));
    setEditingId(escalation.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.description.trim() || !form.assignedTo.trim()) return;
    const pump = PUMPS.find((p) => p.number === form.pumpNumber);
    if (!pump) return;

    if (editingId) {
      setEscalations((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                pumpNumber: pump.number,
                pumpName: pump.name,
                city: pump.city,
                type: form.type,
                severity: form.severity,
                description: form.description.trim(),
                raisedDate: form.raisedDate,
                status: form.status,
                assignedTo: form.assignedTo.trim(),
              }
            : e,
        ),
      );
    } else {
      const nextNumber = escalations.length + 301;
      const newEscalation: Escalation = {
        id: `ESC-${nextNumber}`,
        pumpNumber: pump.number,
        pumpName: pump.name,
        city: pump.city,
        type: form.type,
        severity: form.severity,
        description: form.description.trim(),
        raisedDate: form.raisedDate,
        status: form.status,
        assignedTo: form.assignedTo.trim(),
      };
      setEscalations((prev) => [newEscalation, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue Escalation"
        description="Low sales, payment delays and complaints raised across your assigned pumps."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Raise Issue
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active issues" value={String(openCount)} icon={AlertTriangleIcon} trend={openCount > 0 ? "down" : "up"} delta={openCount > 0 ? "Needs review" : "All clear"} />
        <StatCard label="Critical" value={String(criticalCount)} trend="down" delta="Highest priority" />
        <StatCard label="Low sales alerts" value={String(lowSalesCount)} icon={TrendingUpIcon} />
        <StatCard label="Resolved" value={String(resolvedCount)} trend="up" delta="Closed out" />
      </div>

      <SectionCard
        title="Escalation log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("issue-escalations", filtered.map((e) => ({
                ID: e.id, Pump: `Pump ${e.pumpNumber}`, City: e.city, Type: e.type, Severity: e.severity,
                Status: e.status, "Raised Date": e.raisedDate, "Assigned To": e.assignedTo, Description: e.description,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search pump, ID or description…" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={TYPES} label="Type" />
          <FilterSelect value={severityFilter} onChange={setSeverityFilter} options={SEVERITIES} label="Severity" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Assigned to</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{e.id}</p>
                    <p className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400" title={e.description}>{e.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700 dark:text-slate-300">Pump {e.pumpNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.city}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.type}</td>
                  <td className="px-5 py-3">
                    <Badge tone={SEVERITY_TONE[e.severity]}>{e.severity}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.assignedTo}</td>
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
                    No escalations match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {escalations.length} issues
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Issue" : "Raise Issue"} onClose={() => setShowAdd(false)}>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Date raised</label>
                <input
                  required
                  type="date"
                  value={form.raisedDate}
                  onChange={(e) => setForm((f) => ({ ...f, raisedDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EscalationType }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as EscalationSeverity }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EscalationStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Assigned to</label>
              <input
                required
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                placeholder="e.g. Tariq Naveed"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Raise Issue"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

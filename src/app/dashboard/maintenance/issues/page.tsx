// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertTriangleIcon, ClipboardIcon, PlusIcon } from "@/components/icons";
import { assignedPumps, pumpLabel, type IssueSeverity, type IssueStatus, type MaintenanceIssue } from "@/lib/dashboard/data/maintenance";
import { useMaintenance } from "@/lib/store/use-maintenance";

const SEVERITIES: IssueSeverity[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: IssueStatus[] = ["Open", "Acknowledged", "Resolved"];
const NEXT_STATUS: Record<IssueStatus, IssueStatus> = { Open: "Acknowledged", Acknowledged: "Resolved", Resolved: "Open" };

type IssueFormState = {
  pumpId: string;
  dispenserId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
};

export default function MaintenanceIssuesPage() {
  const pumps = assignedPumps();
  const { dispensers, issues, repairs, reportIssue, updateIssueStatus, startRepairFromIssue } = useMaintenance();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<IssueFormState>(() => emptyForm(pumps[0]?.id ?? ""));

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || i.status === status;
      const matchesSeverity = severity === "All" || i.severity === severity;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [issues, search, status, severity]);

  const openCount = issues.filter((i) => i.status === "Open").length;
  const acknowledgedCount = issues.filter((i) => i.status === "Acknowledged").length;
  const resolvedCount = issues.filter((i) => i.status === "Resolved").length;

  function emptyForm(pumpId: string): IssueFormState {
    return { pumpId, dispenserId: "", title: "", description: "", severity: "Medium" };
  }

  function openAdd() {
    setForm(emptyForm(pumps[0]?.id ?? ""));
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.pumpId) return;
    reportIssue({
      pumpId: form.pumpId,
      dispenserId: form.dispenserId || null,
      title: form.title,
      description: form.description,
      severity: form.severity,
    });
    setShowForm(false);
  }

  function hasActiveRepair(issue: MaintenanceIssue) {
    return repairs.some((r) => r.issueId === issue.id && (r.status === "Pending" || r.status === "In Progress"));
  }

  const dispensersForForm = dispensers.filter((d) => d.pumpId === form.pumpId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Issues"
        description="Record and track problems found on your assigned pumps' dispensers and machines."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Report Issue
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(openCount)} icon={AlertTriangleIcon} trend={openCount > 0 ? "down" : "up"} delta={openCount > 0 ? "Needs review" : "None"} />
        <StatCard label="Acknowledged" value={String(acknowledgedCount)} icon={ClipboardIcon} />
        <StatCard label="Resolved" value={String(resolvedCount)} trend="up" delta="Closed out" />
      </div>

      <SectionCard title="All reported issues">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search title or issue ID…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
          <FilterSelect value={severity} onChange={setSeverity} options={SEVERITIES} label="Severity" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Issue</th>
                <th className="px-5 py-3 font-medium">Pump / Dispenser</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reported</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{issue.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{issue.id}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {pumpLabel(issue.pumpId)}
                    {issue.dispenserId && (
                      <span className="block text-xs text-slate-400">{dispensers.find((d) => d.id === issue.dispenserId)?.label}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={issue.severity === "Critical" || issue.severity === "High" ? "danger" : issue.severity === "Medium" ? "warning" : "neutral"}>
                      {issue.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => updateIssueStatus(issue.id, NEXT_STATUS[issue.status])} className="cursor-pointer">
                      <Badge>{issue.status}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{issue.reportedOn}</td>
                  <td className="px-5 py-3 text-right">
                    {issue.status !== "Resolved" && !hasActiveRepair(issue) ? (
                      <button
                        type="button"
                        onClick={() => startRepairFromIssue(issue.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Start Repair
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No issues match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {issues.length} issues
        </p>
      </SectionCard>

      {showForm && (
        <Modal title="Report Maintenance Issue" onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
              <select
                value={form.pumpId}
                onChange={(e) => setForm((f) => ({ ...f, pumpId: e.target.value, dispenserId: "" }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {pumps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Pump {p.number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Dispenser (optional)</label>
              <select
                value={form.dispenserId}
                onChange={(e) => setForm((f) => ({ ...f, dispenserId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">General / whole pump</option>
                {dispensersForForm.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} ({d.fuelType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Nozzle leaking on Dispenser 1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="What did you observe?"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as IssueSeverity }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Report Issue
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

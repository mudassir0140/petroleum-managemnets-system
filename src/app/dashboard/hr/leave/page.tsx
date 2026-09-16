// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon, ClipboardIcon, PlusIcon, XCircleIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { EMPLOYEES } from "@/lib/dashboard/data/employees";
import { LEAVE_REQUESTS, LEAVE_TYPES, type LeaveRequest, type LeaveType } from "@/lib/dashboard/data/leave";

const STATUSES = ["Pending", "Approved", "Rejected"];

function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diff = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
}

type LeaveFormState = {
  employeeId: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
};

function emptyForm(): LeaveFormState {
  return {
    employeeId: EMPLOYEES[0]?.id ?? "",
    type: "Casual",
    fromDate: "",
    toDate: "",
    reason: "",
  };
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>(LEAVE_REQUESTS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<LeaveFormState>(emptyForm());

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || r.status === status;
      const matchesType = type === "All" || r.type === type;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, search, status, type]);

  const pending = requests.filter((r) => r.status === "Pending").length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const rejected = requests.filter((r) => r.status === "Rejected").length;
  const approvedDays = requests.filter((r) => r.status === "Approved").reduce((sum, r) => sum + r.days, 0);

  function setRequestStatus(id: string, nextStatus: LeaveRequest["status"]) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.employeeId || !form.fromDate || !form.toDate) return;
    const employee = EMPLOYEES.find((e) => e.id === form.employeeId);
    if (!employee) return;

    const newRequest: LeaveRequest = {
      id: `LV-${2200 + requests.length + 1}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      type: form.type,
      fromDate: form.fromDate,
      toDate: form.toDate,
      days: daysBetween(form.fromDate, form.toDate),
      reason: form.reason.trim() || "—",
      status: "Pending",
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...prev]);
    setShowAdd(false);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Leave requests across the company — approve, reject or file a new one."
        actions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            New Leave Request
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={String(pending)} icon={ClipboardIcon} hint="awaiting decision" />
        <StatCard label="Approved" value={String(approved)} trend="up" delta="This period" />
        <StatCard label="Rejected" value={String(rejected)} trend="down" delta="This period" />
        <StatCard label="Approved leave days" value={String(approvedDays)} hint="total days taken" />
      </div>

      <SectionCard
        title="All leave requests"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("leave-requests", filtered.map((r) => ({
                ID: r.id,
                Employee: r.employeeName,
                Department: r.department,
                Type: r.type,
                From: r.fromDate,
                To: r.toDate,
                Days: r.days,
                Reason: r.reason,
                Status: r.status,
                "Applied On": r.appliedOn,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee or leave ID…" />
          <FilterSelect value={type} onChange={setType} options={LEAVE_TYPES} label="Type" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.employeeName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.department} · {r.id}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.type}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {r.fromDate === r.toDate ? r.fromDate : `${r.fromDate} → ${r.toDate}`}
                    <span className="ml-1 text-xs text-slate-400">({r.days}d)</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.reason}</td>
                  <td className="px-5 py-3">
                    <Badge>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {r.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, "Approved")}
                          aria-label={`Approve ${r.employeeName}'s leave`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
                        >
                          <CheckCircleIcon className="size-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestStatus(r.id, "Rejected")}
                          aria-label={`Reject ${r.employeeName}'s leave`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <XCircleIcon className="size-3.5" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-slate-400">Decided</p>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No leave requests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {requests.length} requests
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title="New Leave Request" onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Employee</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Leave type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LeaveType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">From</label>
                <input
                  required
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">To</label>
                <input
                  required
                  type="date"
                  value={form.toDate}
                  onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reason</label>
              <textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Brief reason for leave"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Submit Request
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CreditCardIcon, EditIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { EMPLOYEES } from "@/lib/dashboard/data/employees";
import {
  PAY_PERIOD,
  PAYROLL_RECORDS,
  totalByStatus,
  totalNetPayroll,
  type PayrollRecord,
  type PayrollStatus,
} from "@/lib/dashboard/data/payroll";

const STATUSES: PayrollStatus[] = ["Paid", "Processing", "Pending"];

type PayrollFormState = { bonus: string; deductions: string; status: PayrollStatus };

export default function PayrollCoordinationPage() {
  const [records, setRecords] = useState<PayrollRecord[]>(PAYROLL_RECORDS);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [form, setForm] = useState<PayrollFormState>({ bonus: "0", deductions: "0", status: "Pending" });

  const departments = Array.from(new Set(EMPLOYEES.map((e) => e.department)));

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchesDept = department === "All" || r.department === department;
      const matchesStatus = status === "All" || r.status === status;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [records, search, department, status]);

  function openEdit(record: PayrollRecord) {
    setEditing(record);
    setForm({ bonus: String(record.bonus), deductions: String(record.deductions), status: record.status });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const bonus = Number(form.bonus) || 0;
    const deductions = Number(form.deductions) || 0;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editing.id
          ? {
              ...r,
              bonus,
              deductions,
              netPay: r.baseSalary + bonus - deductions,
              status: form.status,
              paidOn: form.status === "Paid" ? (r.paidOn ?? new Date().toISOString().slice(0, 10)) : r.paidOn,
            }
          : r,
      ),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Coordination"
        description={`Salary, bonuses and deductions for ${PAY_PERIOD} — coordinate with Finance before marking as paid.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total net payroll" value={formatCurrency(totalNetPayroll(records))} icon={CreditCardIcon} hint={PAY_PERIOD} />
        <StatCard label="Paid" value={formatCurrency(totalByStatus("Paid", records))} trend="up" delta="Settled" />
        <StatCard label="Processing" value={formatCurrency(totalByStatus("Processing", records))} />
        <StatCard label="Pending" value={formatCurrency(totalByStatus("Pending", records))} trend="down" delta="Not yet run" />
      </div>

      <SectionCard
        title="Payroll records"
        description="Click a row to adjust bonuses, deductions or mark as paid"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("payroll-coordination", filtered.map((r) => ({
                Employee: r.employeeName,
                Department: r.department,
                "Base Salary (Rs.)": r.baseSalary,
                "Bonus (Rs.)": r.bonus,
                "Deductions (Rs.)": r.deductions,
                "Net Pay (Rs.)": r.netPay,
                Status: r.status,
                "Pay Period": r.payPeriod,
                "Paid On": r.paidOn ?? "—",
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee or ID…" />
          <FilterSelect value={department} onChange={setDepartment} options={departments} label="Department" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Base salary</th>
                <th className="px-5 py-3 font-medium">Bonus</th>
                <th className="px-5 py-3 font-medium">Deductions</th>
                <th className="px-5 py-3 font-medium">Net pay</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.employeeName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.department} · {r.employeeId}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(r.baseSalary)}</td>
                  <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400">
                    {r.bonus > 0 ? `+${formatCurrency(r.bonus)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-rose-600 dark:text-rose-400">
                    {r.deductions > 0 ? `-${formatCurrency(r.deductions)}` : "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(r.netPay)}</td>
                  <td className="px-5 py-3">
                    <Badge>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      aria-label={`Adjust payroll for ${r.employeeName}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No payroll records match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {records.length} records
        </p>
      </SectionCard>

      {editing && (
        <Modal
          title={`Adjust payroll — ${editing.employeeName}`}
          subtitle={`${editing.department} · Base ${formatCurrency(editing.baseSalary)}`}
          onClose={() => setEditing(null)}
        >
          <DetailRow label="Pay period" value={editing.payPeriod} />
          <DetailRow label="Paid on" value={editing.paidOn ?? "Not yet paid"} />
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Bonus (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={form.bonus}
                  onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Deductions (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={form.deductions}
                  onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PayrollStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New net pay:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(editing.baseSalary + (Number(form.bonus) || 0) - (Number(form.deductions) || 0))}
              </span>
            </p>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Save Changes
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

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
import { PUMP_OWNERS, type PaymentStatus, type PumpOwnerAccount } from "@/lib/dashboard/data/pump-owners";

const STATUSES: PaymentStatus[] = ["Paid", "Pending", "Overdue"];

type LedgerFormState = { amount: string; date: string };

export default function AccountsPumpOwnerLedgerPage() {
  const [owners, setOwners] = useState<PumpOwnerAccount[]>(PUMP_OWNERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<PumpOwnerAccount | null>(null);
  const [form, setForm] = useState<LedgerFormState>({ amount: "", date: new Date().toISOString().slice(0, 10) });

  const filtered = useMemo(() => {
    return owners.filter((o) => {
      const matchesSearch =
        o.owner.toLowerCase().includes(search.toLowerCase()) || o.pumpName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || o.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [owners, search, status]);

  const totalRemainingDue = owners.reduce((sum, o) => sum + o.remainingDue, 0);
  const totalPaidYtd = owners.reduce((sum, o) => sum + o.totalPaidYtd, 0);
  const overdueCount = owners.filter((o) => o.status === "Overdue").length;

  function openRecordPayment(owner: PumpOwnerAccount) {
    setEditing(owner);
    setForm({ amount: "", date: new Date().toISOString().slice(0, 10) });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const amount = Number(form.amount) || 0;
    if (amount <= 0) return;

    setOwners((prev) =>
      prev.map((o) => {
        if (o.pumpId !== editing.pumpId) return o;
        const remainingDue = Math.max(0, o.remainingDue - amount);
        return {
          ...o,
          remainingDue,
          status: remainingDue === 0 ? "Paid" : o.status === "Overdue" && remainingDue > 0 ? "Pending" : o.status,
          lastPaymentDate: form.date,
          lastPaymentAmount: amount,
          totalPaidYtd: o.totalPaidYtd + amount,
        };
      }),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Owner Ledger"
        description="Advance payments, remaining dues and payment history for every pump owner."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pump owners" value={String(owners.length)} icon={CreditCardIcon} />
        <StatCard label="Remaining due" value={formatCurrency(totalRemainingDue)} trend="down" delta={`${overdueCount} overdue`} />
        <StatCard label="Paid YTD" value={formatCurrency(totalPaidYtd)} trend="up" delta="+18.2%" hint="vs. last year" />
        <StatCard label="Overdue accounts" value={String(overdueCount)} trend="down" delta="Follow up" />
      </div>

      <SectionCard
        title="Ledger — all pump owners"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pump-owner-ledger", filtered.map((o) => ({
                Pump: `Pump ${o.pumpNumber}`,
                Owner: o.owner,
                Phone: o.phone,
                "Advance Paid (Rs.)": o.advancePaid,
                "Remaining Due (Rs.)": o.remainingDue,
                "Due Date": o.dueDate,
                Status: o.status,
                "Last Payment Date": o.lastPaymentDate,
                "Last Payment (Rs.)": o.lastPaymentAmount,
                "Total Paid YTD (Rs.)": o.totalPaidYtd,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search owner or pump…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Owner / Pump</th>
                <th className="px-5 py-3 font-medium">Advance paid</th>
                <th className="px-5 py-3 font-medium">Remaining due</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((o) => (
                <tr key={o.pumpId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{o.owner}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pump {o.pumpNumber} · {o.pumpName}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(o.advancePaid)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {o.remainingDue > 0 ? formatCurrency(o.remainingDue) : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{o.dueDate}</td>
                  <td className="px-5 py-3">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openRecordPayment(o)}
                      aria-label={`Record payment for ${o.owner}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Record Payment
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No pump owners match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {owners.length} pump owners
        </p>
      </SectionCard>

      {editing && (
        <Modal
          title={`Record payment — ${editing.owner}`}
          subtitle={`Pump ${editing.pumpNumber} · ${editing.pumpName}`}
          onClose={() => setEditing(null)}
        >
          <DetailRow label="Remaining due" value={formatCurrency(editing.remainingDue)} />
          <DetailRow label="Last payment" value={`${formatCurrency(editing.lastPaymentAmount)} on ${editing.lastPaymentDate}`} />
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Payment amount (Rs.)</label>
              <input
                required
                autoFocus
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 150000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Payment date</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Record Payment
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, WalletIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import {
  COMPANY_PAYMENTS,
  type CompanyPayment,
  type PaymentDirection,
  type PaymentMethod,
  type PaymentProcessStatus,
} from "@/lib/dashboard/data/payments";

const DIRECTIONS: PaymentDirection[] = ["Incoming", "Outgoing"];
const METHODS: PaymentMethod[] = ["Bank Transfer", "Cheque", "Cash"];
const STATUSES: PaymentProcessStatus[] = ["Completed", "Processing", "Failed"];

type PaymentFormState = {
  party: string;
  direction: PaymentDirection;
  amount: string;
  method: PaymentMethod;
  date: string;
  reference: string;
  status: PaymentProcessStatus;
};

function emptyForm(): PaymentFormState {
  return {
    party: "",
    direction: "Incoming",
    amount: "",
    method: "Bank Transfer",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    status: "Processing",
  };
}

function formFromPayment(payment: CompanyPayment): PaymentFormState {
  return {
    party: payment.party,
    direction: payment.direction,
    amount: String(payment.amount),
    method: payment.method,
    date: payment.date,
    reference: payment.reference,
    status: payment.status,
  };
}

export default function AccountsPaymentsPage() {
  const [payments, setPayments] = useState<CompanyPayment[]>(COMPANY_PAYMENTS);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormState>(emptyForm());

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.party.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase());
      const matchesDirection = direction === "All" || p.direction === direction;
      const matchesStatus = status === "All" || p.status === status;
      return matchesSearch && matchesDirection && matchesStatus;
    });
  }, [payments, search, direction, status]);

  const incoming = payments.filter((p) => p.direction === "Incoming").reduce((sum, p) => sum + p.amount, 0);
  const outgoing = payments.filter((p) => p.direction === "Outgoing").reduce((sum, p) => sum + p.amount, 0);
  const processing = payments.filter((p) => p.status === "Processing").length;
  const failed = payments.filter((p) => p.status === "Failed").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(payment: CompanyPayment) {
    setForm(formFromPayment(payment));
    setEditingId(payment.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.party.trim()) return;
    const amount = Number(form.amount) || 0;
    if (amount <= 0) return;

    if (editingId) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                party: form.party.trim(),
                direction: form.direction,
                amount,
                method: form.method,
                date: form.date,
                reference: form.reference.trim() || p.reference,
                status: form.status,
              }
            : p,
        ),
      );
    } else {
      const newPayment: CompanyPayment = {
        id: `CPAY-${9000 + payments.length + 1}`,
        party: form.party.trim(),
        direction: form.direction,
        amount,
        method: form.method,
        date: form.date,
        reference: form.reference.trim() || "—",
        status: form.status,
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company-level Payment Processing"
        description="Record and process incoming and outgoing company payments against invoices."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Record Payment
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Incoming total" value={formatCurrency(incoming)} icon={WalletIcon} trend="up" delta="Receivable" />
        <StatCard label="Outgoing total" value={formatCurrency(outgoing)} trend="down" delta="Payable" />
        <StatCard label="Processing" value={String(processing)} />
        <StatCard label="Failed" value={String(failed)} trend={failed > 0 ? "down" : "up"} delta={failed > 0 ? "Needs retry" : "None"} />
      </div>

      <SectionCard
        title="All payments"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("company-payments", filtered.map((p) => ({
                ID: p.id,
                Party: p.party,
                Direction: p.direction,
                "Amount (Rs.)": p.amount,
                Method: p.method,
                Date: p.date,
                Reference: p.reference,
                Status: p.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search party, payment ID or reference…" />
          <FilterSelect value={direction} onChange={setDirection} options={DIRECTIONS} label="Direction" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Party</th>
                <th className="px-5 py-3 font-medium">Direction</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{p.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {p.party}
                    <span className="block text-xs text-slate-400">{p.method} · {p.date}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={p.direction === "Incoming" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}>
                      {p.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.reference}</td>
                  <td className="px-5 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.id}`}
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
                    No payments match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {payments.length} payments
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Payment" : "Record Payment"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Party</label>
              <input
                required
                value={form.party}
                onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
                placeholder="e.g. Sana Malik (Pump 3)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as PaymentDirection }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Amount (Rs.)</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reference (invoice ID)</label>
                <input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="e.g. INV-3301"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PaymentProcessStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Record Payment"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

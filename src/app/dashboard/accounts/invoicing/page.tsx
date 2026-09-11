"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DocumentIcon, EditIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { INVOICES, type Invoice, type InvoiceStatus } from "@/lib/dashboard/data/finance";

const TYPES = ["Receivable", "Payable"];
const STATUSES: InvoiceStatus[] = ["Paid", "Pending", "Overdue"];

type InvoiceFormState = {
  party: string;
  type: Invoice["type"];
  amount: string;
  dueDate: string;
  status: InvoiceStatus;
};

function emptyForm(): InvoiceFormState {
  return {
    party: "",
    type: "Receivable",
    amount: "",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "Pending",
  };
}

function formFromInvoice(invoice: Invoice): InvoiceFormState {
  return {
    party: invoice.party,
    type: invoice.type,
    amount: String(invoice.amount),
    dueDate: invoice.dueDate,
    status: invoice.status,
  };
}

export default function AccountsInvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm());

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.party.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = type === "All" || inv.type === type;
      const matchesStatus = status === "All" || inv.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [invoices, search, type, status]);

  const receivable = invoices.filter((i) => i.type === "Receivable").reduce((sum, i) => sum + i.amount, 0);
  const payable = invoices.filter((i) => i.type === "Payable").reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(invoice: Invoice) {
    setForm(formFromInvoice(invoice));
    setEditingId(invoice.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.party.trim()) return;
    const amount = Number(form.amount) || 0;
    if (amount <= 0) return;

    if (editingId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingId
            ? { ...inv, party: form.party.trim(), type: form.type, amount, dueDate: form.dueDate, status: form.status }
            : inv,
        ),
      );
    } else {
      const prefix = form.type === "Receivable" ? 3300 : 7700;
      const newInvoice: Invoice = {
        id: `INV-${prefix + invoices.length + 1}`,
        party: form.party.trim(),
        type: form.type,
        amount,
        dueDate: form.dueDate,
        status: form.status,
      };
      setInvoices((prev) => [newInvoice, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoicing"
        description="Generate and track receivable and payable invoices."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            New Invoice
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total invoices" value={String(invoices.length)} icon={DocumentIcon} />
        <StatCard label="Receivable" value={formatCurrency(receivable)} trend="up" delta="Owed to us" />
        <StatCard label="Payable" value={formatCurrency(payable)} trend="down" delta="We owe" />
        <StatCard label="Overdue" value={String(overdue)} trend={overdue > 0 ? "down" : "up"} delta={overdue > 0 ? "Needs follow-up" : "None"} />
      </div>

      <SectionCard
        title="All invoices"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("invoicing", filtered.map((inv) => ({
                ID: inv.id,
                Party: inv.party,
                Type: inv.type,
                "Amount (Rs.)": inv.amount,
                "Due Date": inv.dueDate,
                Status: inv.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search party or invoice ID…" />
          <FilterSelect value={type} onChange={setType} options={TYPES} label="Type" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Party</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{inv.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{inv.party}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{inv.type}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{inv.dueDate}</td>
                  <td className="px-5 py-3">
                    <Badge>{inv.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(inv)}
                      aria-label={`Edit ${inv.id}`}
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
                    No invoices match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {invoices.length} invoices
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Invoice" : "New Invoice"} onClose={() => setShowForm(false)}>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Invoice["type"] }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Due date</label>
                <input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
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
              {editingId ? "Save Changes" : "Create Invoice"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

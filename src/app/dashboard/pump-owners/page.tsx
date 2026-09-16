// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CreditCardIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import { PAYMENT_TRANSACTIONS, PUMP_OWNERS, type PumpOwnerAccount } from "@/lib/dashboard/data/pump-owners";

const STATUSES = ["Paid", "Pending", "Overdue"];

export default function PumpOwnersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<PumpOwnerAccount | null>(null);

  const filtered = useMemo(() => {
    return PUMP_OWNERS.filter((owner) => {
      const matchesSearch =
        owner.owner.toLowerCase().includes(search.toLowerCase()) ||
        owner.pumpName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || owner.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  const totalRemainingDue = PUMP_OWNERS.reduce((sum, o) => sum + o.remainingDue, 0);
  const overdueCount = PUMP_OWNERS.filter((o) => o.status === "Overdue").length;
  const totalPaidYtd = PUMP_OWNERS.reduce((sum, o) => sum + o.totalPaidYtd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Owners & Payments"
        description="Advance payments, remaining dues and payment history for every pump owner."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pump owners" value={String(PUMP_OWNERS.length)} icon={CreditCardIcon} />
        <StatCard label="Remaining due" value={formatCurrency(totalRemainingDue)} trend="down" delta={`${overdueCount} overdue`} />
        <StatCard label="Paid YTD" value={formatCurrency(totalPaidYtd)} trend="up" delta="+18.2%" hint="vs. last year" />
        <StatCard label="Overdue accounts" value={String(overdueCount)} trend="down" delta="Follow up" />
      </div>

      <SectionCard
        title="Pump owners"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pump-owners", filtered.map((o) => ({
                Pump: `Pump ${o.pumpNumber}`,
                Owner: o.owner,
                Phone: o.phone,
                "Advance Paid (Rs.)": o.advancePaid,
                "Remaining Due (Rs.)": o.remainingDue,
                "Due Date": o.dueDate,
                Status: o.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search owner or pump…" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Payment status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Advance paid</th>
                <th className="px-5 py-3 font-medium">Remaining due</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((owner) => (
                <tr
                  key={owner.pumpId}
                  onClick={() => setSelected(owner)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">Pump {owner.pumpNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{owner.pumpName}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {owner.owner}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{owner.phone}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(owner.advancePaid)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {owner.remainingDue > 0 ? formatCurrency(owner.remainingDue) : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{owner.dueDate}</td>
                  <td className="px-5 py-3">
                    <Badge>{owner.status}</Badge>
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
          Showing {filtered.length} of {PUMP_OWNERS.length} owners · click a row for full details
        </p>
      </SectionCard>

      <SectionCard
        title="Recent payment transactions"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("payment-transactions", PAYMENT_TRANSACTIONS.map((p) => ({
                ID: p.id,
                Owner: p.owner,
                Pump: p.pumpName,
                "Amount (Rs.)": p.amount,
                Date: p.date,
                Method: p.method,
                Status: p.status,
              })))
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Transaction</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {PAYMENT_TRANSACTIONS.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{p.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {p.owner}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{p.pumpName}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.method}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.date}</td>
                  <td className="px-5 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selected && (
        <Modal
          title={`Pump ${selected.pumpNumber} — ${selected.pumpName}`}
          subtitle={`Owner: ${selected.owner}`}
          onClose={() => setSelected(null)}
        >
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="Email" value={selected.email} />
          <DetailRow label="Advance paid" value={formatCurrency(selected.advancePaid)} />
          <DetailRow label="Remaining due" value={selected.remainingDue > 0 ? formatCurrency(selected.remainingDue) : "None"} />
          <DetailRow label="Due date" value={selected.dueDate} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
          <DetailRow label="Last payment" value={`${formatCurrency(selected.lastPaymentAmount)} on ${selected.lastPaymentDate}`} />
          <DetailRow label="Total paid (YTD)" value={formatCurrency(selected.totalPaidYtd)} />
        </Modal>
      )}
    </div>
  );
}

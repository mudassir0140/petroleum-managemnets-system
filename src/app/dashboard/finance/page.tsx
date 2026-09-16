// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { WalletIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import {
  DAILY_PAYMENTS,
  EXPENSE_BREAKDOWN,
  FINANCE_KPIS,
  INVOICES,
  MONTHLY_FINANCE,
  WEEKLY_PAYMENT_SUMMARY,
} from "@/lib/dashboard/data/finance";
import { PUMPS, pumpTodayRevenue } from "@/lib/dashboard/data/pumps";

const TYPES = ["Receivable", "Payable"];
const STATUSES = ["Paid", "Pending", "Overdue"];

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    return INVOICES.filter((inv) => {
      const matchesSearch = inv.party.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = type === "All" || inv.type === type;
      const matchesStatus = status === "All" || inv.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, type, status]);

  const maxValue = Math.max(...MONTHLY_FINANCE.map((m) => m.revenue));
  const maxWeeklyPayment = Math.max(...WEEKLY_PAYMENT_SUMMARY.map((d) => d.received));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Daily, weekly and monthly payments, per-pump sales and profit & loss."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Payments received today" value={formatCurrency(DAILY_PAYMENTS.received)} icon={WalletIcon} trend="up" delta="+4.6%" />
        <StatCard label="Payments remaining today" value={formatCurrency(DAILY_PAYMENTS.remaining)} trend="down" delta="Outstanding" />
        {FINANCE_KPIS.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} trend={kpi.trend} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Weekly payment summary" className="lg:col-span-2">
          <div className="p-5">
            <div className="flex h-44 items-end gap-3">
              {WEEKLY_PAYMENT_SUMMARY.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-32 w-full flex-col-reverse gap-0.5">
                    <div
                      className="w-full rounded-b-md bg-amber-500"
                      style={{ height: `${(day.received / maxWeeklyPayment) * 100}%` }}
                      title={`Received ${formatCurrency(day.received)}`}
                    />
                    <div
                      className="w-full rounded-t-md bg-rose-400"
                      style={{ height: `${(day.remaining / maxWeeklyPayment) * 100}%` }}
                      title={`Remaining ${formatCurrency(day.remaining)}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Received</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-400" />Remaining</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Expense breakdown">
          <div className="space-y-3 p-5">
            {EXPENSE_BREAKDOWN.map((expense) => (
              <div key={expense.category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{expense.category}</span>
                  <span className="text-slate-500 dark:text-slate-400">{expense.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${expense.color}`} style={{ width: `${expense.percent}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Revenue, expenses & profit — last 6 months">
        <div className="p-5">
          <div className="flex h-52 items-end gap-4">
            {MONTHLY_FINANCE.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-40 w-full items-end gap-1">
                  <div className="flex-1 rounded-t-md bg-amber-500" style={{ height: `${(m.revenue / maxValue) * 100}%` }} title={`Revenue Rs. ${m.revenue}M`} />
                  <div className="flex-1 rounded-t-md bg-slate-300 dark:bg-slate-700" style={{ height: `${(m.expenses / maxValue) * 100}%` }} title={`Expenses Rs. ${m.expenses}M`} />
                  <div className="flex-1 rounded-t-md bg-emerald-500" style={{ height: `${(m.profit / maxValue) * 100}%` }} title={`Profit Rs. ${m.profit}M`} />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Revenue</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300 dark:bg-slate-700" />Expenses</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Profit</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Every pump's monthly sale"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pump-monthly-sales", PUMPS.map((p) => ({
                Pump: `Pump ${p.number}`,
                Name: p.name,
                "Today Revenue (Rs.)": pumpTodayRevenue(p),
                "This Month (Rs.)": p.monthlySales,
                "Last Month (Rs.)": p.lastMonthSales,
              })))
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Today</th>
                <th className="px-5 py-3 font-medium">This month</th>
                <th className="px-5 py-3 font-medium">Last month</th>
                <th className="px-5 py-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {PUMPS.map((p) => {
                const change = p.lastMonthSales === 0 ? 0 : ((p.monthlySales - p.lastMonthSales) / p.lastMonthSales) * 100;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">Pump {p.number}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.name}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(pumpTodayRevenue(p))}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(p.monthlySales)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatCurrency(p.lastMonthSales)}</td>
                    <td className={`px-5 py-3 font-medium ${change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Invoices"
        description="Accounts receivable and payable"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("invoices", filtered.map((inv) => ({
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or party…" />
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No invoices match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {INVOICES.length} invoices
        </p>
      </SectionCard>
    </div>
  );
}

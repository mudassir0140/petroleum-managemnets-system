"use client";

// The Bank and Wallet pages and the Accounts page. Every figure comes from /api/khata/transactions and
// /api/khata/accounts, so these pages only show what the server computed from the saved payments.
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { METHOD_LABELS, type PaymentMethod } from "@/lib/khata/payments";
import { StatusBadge } from "./payment-fields";

interface Row {
  id: string;
  txnId: string;
  kind: "fuel" | "payment";
  date: string;
  clientName: string;
  method: string;
  status: string;
  amount: number;
  advance: number;
  reference: string;
  bankAccount: string;
  bankName: string;
  walletProvider: string;
  attachmentId: string;
  verifiedBy: string;
}

interface Totals {
  confirmed: number;
  pending: number;
  bounced: number;
}

interface AccountGroup {
  name: string;
  confirmed: number;
  pending: number;
  bounced: number;
  monthConfirmed: number;
  count: number;
}

interface Summary {
  month: string;
  overall: { totals: Record<PaymentMethod, Totals>; confirmed: number; pending: number };
  monthly: {
    totals: Record<PaymentMethod, Totals>;
    confirmed: number;
    pending: number;
    opening: number;
    fuel: number;
    allocated: number;
    credit: number;
    closing: number;
  };
  outstanding: { gross: number; credit: number };
  daily: { date: string; totals: Record<PaymentMethod, Totals> }[];
  bankAccounts: AccountGroup[];
  walletProviders: AccountGroup[];
}

const inputClass =
  "mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";

function money(value: unknown): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentMonth(): string {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 7);
}

function dateOnly(value: string): string {
  return value && value.length >= 10 ? value.slice(0, 10) : value || "—";
}

function Stat({ label, value, tone = "text-slate-900 dark:text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>PKR {value}</p>
    </Card>
  );
}

function MonthFilter({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
      Month / مہینہ
      <input type="month" value={month} onChange={(e) => e.target.value && onChange(e.target.value)} className={inputClass} />
    </label>
  );
}

// Bank transfers or mobile wallet payments: balances per account or provider, the history, sources and totals.
export function MethodRecordsView({
  method,
  title,
  urduTitle,
  groupTitle,
  referenceTitle,
}: {
  method: "bank-transfer" | "mobile-wallet";
  title: string;
  urduTitle: string;
  groupTitle: string;
  referenceTitle: string;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "bounced">("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useLivePoll(
    async () => {
      const query = new URLSearchParams({ method });
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      try {
        const [history, accounts] = await Promise.all([
          fetch(`/api/khata/transactions?${query}`, { cache: "no-store" }),
          fetch(`/api/khata/accounts?month=${month}`, { cache: "no-store" }),
        ]);
        if (!history.ok || !accounts.ok) {
          setError("Could not load the records. Try again.");
          return;
        }
        setRows((await history.json()) as Row[]);
        setSummary((await accounts.json()) as Summary);
        setError("");
      } catch {
        setError("Network error. Try again.");
      }
    },
    5000,
    [method, from, to, month],
    true
  );

  const payments = rows.filter((r) => r.kind === "payment");
  const shown = payments.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const groups = (method === "bank-transfer" ? summary?.bankAccounts : summary?.walletProviders) ?? [];
  const overall = summary?.overall.totals[method] ?? { confirmed: 0, pending: 0, bounced: 0 };
  const monthly = summary?.monthly.totals[method] ?? { confirmed: 0, pending: 0, bounced: 0 };

  // Daily totals of confirmed money for the shown range, and the sources that paid it.
  const daily = new Map<string, number>();
  const sources = new Map<string, number>();
  for (const r of payments.filter((x) => x.status === "confirmed")) {
    const day = dateOnly(r.date);
    daily.set(day, (daily.get(day) ?? 0) + r.amount + r.advance);
    sources.set(r.clientName, (sources.get(r.clientName) ?? 0) + r.amount + r.advance);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`${title} / ${urduTitle}`} description={`Every ${METHOD_LABELS[method].en.toLowerCase()} payment, with its status and who verified it`} />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Confirmed balance (all time)" value={money(overall.confirmed)} tone="text-green-600 dark:text-green-400" />
        <Stat label="Waiting for verification" value={money(overall.pending)} tone="text-amber-600 dark:text-amber-400" />
        <Stat label={`Confirmed in ${month}`} value={money(monthly.confirmed)} />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{groupTitle} balances / بیلنس</h2>
          <MonthFilter month={month} onChange={setMonth} />
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No payments recorded yet / ابھی کوئی ادائیگی درج نہیں</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">{groupTitle}</th>
                  <th className="py-2 text-right">Confirmed</th>
                  <th className="py-2 text-right">Pending</th>
                  <th className="py-2 text-right">Bounced</th>
                  <th className="py-2 text-right">In {month}</th>
                  <th className="py-2 text-right">Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {groups.map((g) => (
                  <tr key={g.name}>
                    <td className="py-2 font-medium text-slate-900 dark:text-white">{g.name}</td>
                    <td className="py-2 text-right text-green-700 dark:text-green-400">{money(g.confirmed)}</td>
                    <td className="py-2 text-right text-amber-700 dark:text-amber-400">{money(g.pending)}</td>
                    <td className="py-2 text-right text-red-700 dark:text-red-400">{money(g.bounced)}</td>
                    <td className="py-2 text-right">{money(g.monthConfirmed)}</td>
                    <td className="py-2 text-right">{g.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Daily totals (confirmed) / روزانہ کل</h2>
          {daily.size === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Nothing confirmed in this range</p>
          ) : (
            <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-700">
              {[...daily.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([day, total]) => (
                <li key={day} className="flex justify-between py-2">
                  <span>{day}</span>
                  <span className="font-semibold">PKR {money(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Payment sources / ادائیگی کرنے والے</h2>
          {sources.size === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No confirmed payments yet</p>
          ) : (
            <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-700">
              {[...sources.entries()].sort((a, b) => b[1] - a[1]).map(([name, total]) => (
                <li key={name} className="flex justify-between py-2">
                  <span>{name}</span>
                  <span className="font-semibold">PKR {money(total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-sm font-semibold text-slate-900 dark:text-white">Incoming transactions / ٹرانزیکشنز</h2>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            From / سے
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            To / تک
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Status / حیثیت
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={inputClass}>
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="bounced">Bounced</option>
            </select>
          </label>
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No transactions match these filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Transaction</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">{referenceTitle}</th>
                  <th className="py-2">{groupTitle}</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Verified by</th>
                  <th className="py-2">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {shown.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-2 whitespace-nowrap">{dateOnly(r.date)}</td>
                    <td className="py-2 font-mono text-xs">{r.txnId}</td>
                    <td className="py-2">{r.clientName}</td>
                    <td className="py-2">{r.reference || "—"}</td>
                    <td className="py-2">{method === "bank-transfer" ? r.bankAccount || r.bankName : r.walletProvider}</td>
                    <td className="py-2 text-right font-semibold">
                      {money(r.amount)}
                      {r.advance > 0 && <span className="block text-xs text-blue-700 dark:text-blue-400">+ advance {money(r.advance)}</span>}
                    </td>
                    <td className="py-2">
                      <StatusBadge method={r.method} status={r.status} />
                    </td>
                    <td className="py-2 text-xs">{r.verifiedBy || "—"}</td>
                    <td className="py-2">
                      {r.attachmentId ? (
                        <a href={`/api/khata/attachments/${r.attachmentId}`} target="_blank" rel="noreferrer" className="text-xs text-amber-700 underline dark:text-amber-400">
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-500">
        Record a payment from a client&apos;s khata page. <Link href="/pumpadmin/khata" className="underline">Go to the khata list</Link>
      </p>
    </div>
  );
}

// The overall, monthly and outstanding accounts of the pump, from the same saved records.
export function AccountsView() {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useLivePoll(
    async () => {
      try {
        const response = await fetch(`/api/khata/accounts?month=${month}`, { cache: "no-store" });
        if (!response.ok) {
          setError("Could not load the accounts. Try again.");
          return;
        }
        setSummary((await response.json()) as Summary);
        setError("");
      } catch {
        setError("Network error. Try again.");
      }
    },
    5000,
    [month],
    true
  );

  const methods = Object.keys(METHOD_LABELS) as PaymentMethod[];
  return (
    <div className="space-y-6">
      <PageHeader title="Accounts / کھاتے" description="Overall and monthly totals by payment method, dues and closing balance" />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <MonthFilter month={month} onChange={setMonth} />
        <div className="flex gap-3 text-sm">
          <Link href="/pumpadmin/bank" className="underline text-amber-700 dark:text-amber-400">Bank</Link>
          <Link href="/pumpadmin/wallet" className="underline text-amber-700 dark:text-amber-400">Wallet</Link>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Overall confirmed" value={money(summary.overall.confirmed)} tone="text-green-600 dark:text-green-400" />
            <Stat label="Overall pending" value={money(summary.overall.pending)} tone="text-amber-600 dark:text-amber-400" />
            <Stat label={`Confirmed in ${month}`} value={money(summary.monthly.confirmed)} />
            <Stat label="Outstanding dues" value={money(summary.outstanding.gross)} tone="text-red-600 dark:text-red-400" />
          </div>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Totals by method / طریقہ وار کل</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2">Method</th>
                    <th className="py-2 text-right">Overall confirmed</th>
                    <th className="py-2 text-right">Overall pending</th>
                    <th className="py-2 text-right">{month} confirmed</th>
                    <th className="py-2 text-right">{month} pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {methods.map((m) => (
                    <tr key={m}>
                      <td className="py-2">{METHOD_LABELS[m].en}</td>
                      <td className="py-2 text-right">{money(summary.overall.totals[m]?.confirmed)}</td>
                      <td className="py-2 text-right">{money(summary.overall.totals[m]?.pending)}</td>
                      <td className="py-2 text-right">{money(summary.monthly.totals[m]?.confirmed)}</td>
                      <td className="py-2 text-right">{money(summary.monthly.totals[m]?.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{month} khata / مہینے کا حساب</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">Opening</dt><dd className="font-semibold">PKR {money(summary.monthly.opening)}</dd></div>
              <div><dt className="text-slate-500">Fuel dues</dt><dd className="font-semibold">PKR {money(summary.monthly.fuel)}</dd></div>
              <div><dt className="text-slate-500">Allocated to dues</dt><dd className="font-semibold">PKR {money(summary.monthly.allocated)}</dd></div>
              <div><dt className="text-slate-500">Credit (kept aside)</dt><dd className="font-semibold">PKR {money(summary.monthly.credit)}</dd></div>
              <div><dt className="text-slate-500">Closing</dt><dd className="font-semibold">PKR {money(summary.monthly.closing)}</dd></div>
              <div><dt className="text-slate-500">Unused credit overall</dt><dd className="font-semibold">PKR {money(summary.outstanding.credit)}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Daily totals (all methods) / روزانہ کل</h2>
            {summary.daily.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No payments in {month}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2">Date</th>
                      {methods.map((m) => (
                        <th key={m} className="py-2 text-right">{METHOD_LABELS[m].en}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {summary.daily.map((d) => (
                      <tr key={d.date}>
                        <td className="py-2">{d.date}</td>
                        {methods.map((m) => (
                          <td key={m} className="py-2 text-right">{money(d.totals[m]?.confirmed)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

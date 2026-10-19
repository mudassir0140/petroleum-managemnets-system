"use client";

import { offlineFetch } from "@/lib/offline/outbox";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { IconCheck, IconX } from "@/components/icons";
import { MONTH_STATUS_LABELS, duesBreakdown, monthKeyOf, type MonthRow, type MonthStatus } from "@/lib/khata/ledger";
import { type PaymentMethod } from "@/lib/khata/payments";
import { EMPTY_PAYMENT_FIELDS, MethodFields, StatusBadge, checkFields, uploadProof, type PaymentFieldValues } from "./payment-fields";

// The khata's month list, the selected month's figures, payments with receipts and edits, the close
// confirmation, the audit history, and the CSV and print outputs. Every figure comes from the server.

export interface KhataMonthView {
  _id: string;
  month: string;
  openingBalance: number;
  totalFuel: number;
  paid: number;
  advance: number;
  remaining: number;
  status: "open" | "closed";
  monthStatus: MonthStatus;
  closed: boolean;
  changedAfterClose: boolean;
  closedSnapshot: { opening: number; fuel: number; payments: number; advances: number; closing: number } | null;
  // Unpaid amount of this month on its own (dues less the payments allocated to it), and its credit.
  dueRemaining?: number;
  credit?: number;
}

export interface KhataPaymentView {
  _id: string;
  amountReceived: number;
  advancePaid: number;
  method: string;
  date: string;
  note: string;
  recordedBy?: string;
  khataMonth?: string;
  allocationMode?: string;
  allocations?: Array<{ month: string; amount: number }> | null;
  unallocated?: number;
  txnId?: string;
  status?: string;
  source?: string;
  details?: Record<string, string>;
  attachmentId?: string;
  verifiedBy?: string;
}

interface AuditRow {
  _id: string;
  type: string;
  month: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  monthWasClosed: boolean;
  editedBy: string;
  editedAt: string;
}

const METHODS = [
  { value: "cash", en: "Cash", ur: "نقد" },
  { value: "bank-transfer", en: "Bank transfer", ur: "بینک ٹرانسفر" },
  { value: "mobile-wallet", en: "Mobile wallet", ur: "موبائل والیٹ" },
  { value: "cheque", en: "Cheque", ur: "چیک" },
] as const;

const STATUS_STYLE: Record<MonthStatus, string> = {
  pending: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "partially-paid": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";

function money(value: unknown): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toFixed(2);
}

function methodLabel(value: string): string {
  const found = METHODS.find((m) => m.value === value);
  return found ? `${found.en} / ${found.ur}` : "Not recorded";
}

// Cheque number, bank or wallet reference and transaction ID of a payment, for the list.
function paymentDetail(p: KhataPaymentView): string {
  const d = p.details ?? {};
  return [p.txnId, d.chequeNumber && `Cheque ${d.chequeNumber}`, d.bankName, d.bankAccount, d.transactionId && `Ref ${d.transactionId}`, d.walletProvider]
    .filter(Boolean)
    .join(" · ");
}

function dateOnly(value: string): string {
  return value && value.length >= 10 ? value.slice(0, 10) : value || "—";
}

function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// Whether a month is over, so its closing can be confirmed. The current month closes after it ends.
function isPastMonth(month: string, current: string): boolean {
  return month < current;
}

export function MonthlyKhataPanel({
  khataClientId,
  clientName,
  department,
  months,
  payments,
  onChanged,
}: {
  khataClientId: string;
  clientName: string;
  department: string;
  months: KhataMonthView[];
  payments: KhataPaymentView[];
  onChanged: () => void;
}) {
  // The clock is read once, when the panel opens.
  const [clock] = useState(() => new Date());
  const current = monthKeyOf(clock);
  const [selected, setSelected] = useState<string>(() => current);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Payment form
  const [amount, setAmount] = useState("");
  const [advance, setAdvance] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [paidOn, setPaidOn] = useState("");
  const [note, setNote] = useState("");
  // oldest-first: the payment settles the oldest unpaid months. month: the owner chooses the amount for each month.
  const [allocationMode, setAllocationMode] = useState<"oldest-first" | "month">("oldest-first");
  const [monthAmounts, setMonthAmounts] = useState<Record<string, string>>({});
  // Method fields (cheque, bank, wallet) and the proof image; bank and wallet can be verified at entry.
  const [fields, setFields] = useState<PaymentFieldValues>(EMPTY_PAYMENT_FIELDS);
  const [verifyNow, setVerifyNow] = useState(false);

  // Close confirmation and receipt / edit dialogs
  const [closing, setClosing] = useState(false);
  const [closeAck, setCloseAck] = useState(false);
  const [receipt, setReceipt] = useState<KhataPaymentView | null>(null);
  const [editing, setEditing] = useState<KhataPaymentView | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", advance: "", method: "cash", date: "", note: "", reason: "", confirm: false });

  const sorted = useMemo(() => [...months].sort((a, b) => (a.month < b.month ? 1 : -1)), [months]);
  const breakdown = useMemo(
    () =>
      duesBreakdown(
        [...months]
          .sort((a, b) => (a.month < b.month ? -1 : 1))
          .map(
            (m) =>
              ({
                month: m.month,
                opening: m.openingBalance,
                fuel: m.totalFuel,
                payments: m.paid,
                advances: 0,
                credit: m.credit ?? 0,
                remaining: m.dueRemaining ?? 0,
                closing: m.remaining,
                status: m.monthStatus,
                closed: m.closed,
                closedSnapshot: m.closedSnapshot,
                changedAfterClose: m.changedAfterClose,
              }) as MonthRow
          )
      ),
    [months]
  );
  const owedMonths = breakdown.months;
  const row = sorted.find((m) => m.month === selected) ?? null;
  const monthPayments = payments.filter((p) => (p.khataMonth ?? dateOnly(p.date).slice(0, 7)) === selected);
  const canClose = Boolean(row && !row.closed && isPastMonth(selected, current));
  // The default payment date: today for the current month, otherwise the first day of the month shown.
  const defaultPaidFor = (month: string) =>
    month === current ? new Date(clock.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10) : `${month}-01`;
  const paidDate = paidOn || defaultPaidFor(selected);

  function chooseMonth(month: string) {
    setSelected(month);
    setPaidOn("");
  }

  const auditRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    async function loadAudit() {
      try {
        const response = await fetch(`/api/khata/audit?khataClientId=${khataClientId}`, { cache: "no-store" });
        if (response.ok) setAudit(await response.json());
      } catch {
        // The history is shown again on the next refresh.
      }
    }
    auditRef.current = loadAudit;
    void loadAudit();
  }, [khataClientId]);

  function changed(message: string) {
    setNotice(message);
    setError("");
    void auditRef.current();
    onChanged();
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const received = parseFloat(amount || "0") || 0;
    const advanced = parseFloat(advance || "0") || 0;
    if (received + advanced <= 0) {
      setError("Enter an amount greater than 0 / رقم 0 سے زیادہ درج کریں");
      return;
    }
    if (!paidDate) {
      setError("Choose the payment date / ادائیگی کی تاریخ چنیں");
      return;
    }
    const fieldError = checkFields(method as PaymentMethod, fields);
    if (fieldError) {
      setError(fieldError);
      return;
    }
    const allocations =
      allocationMode === "month"
        ? owedMonths
            .map((m) => ({ month: m.month, amount: parseFloat(monthAmounts[m.month] ?? "0") || 0 }))
            .filter((a) => a.amount > 0)
        : [];
    if (allocationMode === "month") {
      const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
      if (allocated > received + advanced + 1e-9) {
        setError("The amounts for each month add up to more than the payment / مہینوں کی رقم ادائیگی سے زیادہ ہے");
        return;
      }
    }
    setBusy(true);
    try {
      const response = await offlineFetch("/api/khata/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          khataClientId,
          amountReceived: received,
          advancePaid: advanced,
          method,
          date: paidDate,
          note,
          allocationMode,
          allocations,
          verifyNow,
          chequeNumber: fields.chequeNumber,
          chequeDate: fields.chequeDate,
          bankName: fields.bankName,
          bankAccount: fields.bankAccount,
          transactionId: fields.transactionId,
          walletProvider: fields.walletProvider,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not record the payment");
        return;
      }
      if (data.queued) {
        // Saved on this device while offline; it is sent when the connection returns.
        changed("Saved on this device. It will be sent when the internet returns. / انٹرنیٹ آنے پر بھیج دی جائے گی");
        setAmount("");
        setAdvance("");
        setNote("");
        setMonthAmounts({});
        setFields(EMPTY_PAYMENT_FIELDS);
        setVerifyNow(false);
        if (fields.proof) setError("The proof image is not saved while offline. Add it from the payment list once the internet returns.");
        return;
      }
      let proofError = "";
      if (fields.proof && data.paymentId) {
        proofError = (await uploadProof(`/api/khata/payments/${data.paymentId}/proof`, fields.proof)) ?? "";
      }
      setAmount("");
      setAdvance("");
      setNote("");
      setMonthAmounts({});
      setFields(EMPTY_PAYMENT_FIELDS);
      setVerifyNow(false);
      changed(
        data.status === "pending"
          ? "Payment saved as pending. It counts once it is verified or cleared. / ادائیگی زیرِ التوا محفوظ ہو گئی"
          : "Payment recorded. The balance is updated. / ادائیگی درج ہو گئی"
      );
      if (proofError) setError(`Payment saved, but the image was not: ${proofError}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Verifies a bank or wallet payment, clears a cheque, or marks a cheque as bounced. A reason is kept in the history.
  async function changeStatus(p: KhataPaymentView, to: "confirmed" | "bounced") {
    const reason = window.prompt(to === "bounced" ? "Why is this cheque bounced? (kept in the history)" : "Reason for this change, e.g. verified in bank statement (kept in the history)") ?? "";
    if (!reason.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/khata/payments/${p._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, reason: reason.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not change the status");
        return;
      }
      changed(to === "bounced" ? "Marked as bounced. / واپس" : "Payment confirmed. The balance is updated. / ادائیگی تصدیق ہو گئی");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Adds the proof image of a saved payment, now or later.
  async function addProofLater(p: KhataPaymentView, file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const failed = await uploadProof(`/api/khata/payments/${p._id}/proof`, file);
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    changed("Image saved. / تصویر محفوظ ہو گئی");
  }

  async function confirmClose() {
    if (!row || !closeAck) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/khata/months/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ khataClientId, month: selected, confirmed: true, expectedClosing: row.remaining }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not close the month");
        return;
      }
      setClosing(false);
      setCloseAck(false);
      changed(`${monthTitle(selected)} is closed. Its figures are kept in the history. / ${monthTitle(selected)} بند ہو گیا`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(p: KhataPaymentView) {
    setEditing(p);
    setEditForm({
      amount: String(p.amountReceived || 0),
      advance: String(p.advancePaid || 0),
      method: p.method || "cash",
      date: dateOnly(p.date),
      note: p.note || "",
      reason: "",
      confirm: false,
    });
    setError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/khata/payments/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountReceived: parseFloat(editForm.amount || "0") || 0,
          advancePaid: parseFloat(editForm.advance || "0") || 0,
          method: editForm.method,
          date: editForm.date,
          note: editForm.note,
          reason: editForm.reason,
          confirmed: editForm.confirm,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not save the change");
        return;
      }
      setEditing(null);
      changed("Change saved and recorded in the history. / تبدیلی محفوظ ہو گئی");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // The whole history as one CSV: every month with its figures and status.
  function downloadHistory() {
    const header = ["Month", "Opening", "Fuel", "Payments", "Advances", "Closing", "Status", "Closed"];
    const lines = [...sorted].reverse().map((m) => [m.month, m.openingBalance, m.totalFuel, m.paid, m.advance, m.remaining, MONTH_STATUS_LABELS[m.monthStatus].en, m.closed ? "yes" : "no"]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `khata-history-${clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-6 space-y-6">
      <style>{`@media print {
        body * { visibility: hidden; }
        .khata-print-area, .khata-print-area * { visibility: visible; }
        .khata-print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff; }
      }`}</style>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monthly khata / ماہانہ کھاتہ</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {clientName} · {department}. Each month&apos;s opening balance is the previous month&apos;s closing balance.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={downloadHistory} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Download history CSV / CSV
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            Print statement / پرنٹ
          </button>
        </div>
      </div>

      {/* Month filter and month list */}
      <Card className="p-4 print:hidden">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Show month / مہینہ
            <input type="month" value={selected} onChange={(e) => e.target.value && chooseMonth(e.target.value)} className={`${inputClass} w-44`} />
          </label>
          <button type="button" onClick={() => chooseMonth(current)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
            This month / اس مہینے
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((m) => (
            <button
              key={m.month}
              type="button"
              onClick={() => chooseMonth(m.month)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition ${
                selected === m.month ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
              }`}
            >
              <span className="block font-semibold text-slate-900 dark:text-white">{monthTitle(m.month)}</span>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[m.monthStatus]}`}>{MONTH_STATUS_LABELS[m.monthStatus].en}</span>
              <span className="mt-1 block text-slate-600 dark:text-slate-400">Closing {money(m.remaining)}</span>
            </button>
          ))}
        </div>
      </Card>

      {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 print:hidden dark:bg-green-950 dark:text-green-200">{notice}</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 print:hidden dark:bg-red-950 dark:text-red-200">{error}</div>}

      {/* Selected month */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {monthTitle(selected)} <span className="text-xs font-normal text-slate-500">({selected})</span>
          </h3>
          {row && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[row.monthStatus]}`}>{MONTH_STATUS_LABELS[row.monthStatus].en}</span>}
        </div>

        {row?.changedAfterClose && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Records changed after this month was closed. Closed figures: closing {money(row.closedSnapshot?.closing)}; current figures: closing {money(row.remaining)}.
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-xs text-slate-500">Opening / ابتدائی</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">{money(row?.openingBalance)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-xs text-slate-500">Fuel / ایندھن</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">{money(row?.totalFuel)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-xs text-slate-500">Payments / ادائیگی</dt>
            <dd className="font-semibold text-green-700 dark:text-green-400">{money(row?.paid)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-xs text-slate-500">Advances / پیشگی</dt>
            <dd className="font-semibold text-blue-700 dark:text-blue-400">{money(row?.advance)}</dd>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <dt className="text-xs text-slate-500">Closing / اختتامی</dt>
            <dd className="font-bold text-amber-700 dark:text-amber-400">{money(row?.remaining)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          Closing = opening + fuel − payments − advances. A negative closing is credit held for the customer.
        </p>

        {canClose && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300">This month is over. Review it, then close it. / یہ مہینہ ختم ہو چکا ہے۔ جائزہ لے کر بند کریں۔</p>
            {!closing ? (
              <button type="button" onClick={() => setClosing(true)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900">
                Close khata for this month / کھاتہ بند کریں
              </button>
            ) : (
              <div className="w-full space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Confirm closing {monthTitle(selected)}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  The closing balance of {money(row?.remaining)} PKR will be frozen as the month&apos;s record, and it becomes the opening balance of the next month. You can still change a closed month later, with a reason, and each change is recorded.
                </p>
                <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={closeAck} onChange={(e) => setCloseAck(e.target.checked)} className="mt-1" />
                  <span>I have reviewed this month&apos;s figures and confirm closing it. / میں نے تصدیق کی کہ یہ مہینہ بند کرنا ہے</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" disabled={!closeAck || busy} onClick={confirmClose} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                    Confirm close / تصدیق کر کے بند کریں
                  </button>
                  <button type="button" onClick={() => { setClosing(false); setCloseAck(false); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200">
                    Cancel / منسوخ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Outstanding dues: every unpaid month on its own, with the totals */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Outstanding dues by month / ماہانہ بقایا جات</h3>
        {owedMonths.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No unpaid dues / کوئی بقایا نہیں</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2">Month / مہینہ</th>
                  <th className="py-2 text-right">Original dues</th>
                  <th className="py-2 text-right">Payments received</th>
                  <th className="py-2 text-right">Remaining</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {owedMonths.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 font-medium text-slate-900 dark:text-white">{monthTitle(m.month)}</td>
                    <td className="py-2 text-right">{money(m.originalDues)}</td>
                    <td className="py-2 text-right text-green-700 dark:text-green-400">{money(m.paymentsReceived)}</td>
                    <td className="py-2 text-right font-semibold text-amber-700 dark:text-amber-400">{money(m.remaining)}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[m.status]}`}>{MONTH_STATUS_LABELS[m.status].en}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <dt className="text-xs text-slate-600 dark:text-slate-400">Grand total outstanding / کل بقایا</dt>
            <dd className="text-lg font-bold text-amber-700 dark:text-amber-400">{money(breakdown.grossOutstanding)}</dd>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <dt className="text-xs text-slate-600 dark:text-slate-400">Credit not allocated / غیر تقسیم شدہ پیشگی</dt>
            <dd className="text-lg font-bold text-green-700 dark:text-green-400">{money(breakdown.unallocatedCredit)}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <dt className="text-xs text-slate-600 dark:text-slate-400">Net balance (dues − credit) / خالص بقایا</dt>
            <dd className="text-lg font-bold text-slate-900 dark:text-white">{money(breakdown.netBalance)}</dd>
          </div>
        </dl>
      </Card>

      {/* Record a payment */}
      {(
        <Card className="p-5 print:hidden">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Record payment / ادائیگی درج کریں</h3>
          <form onSubmit={recordPayment} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Amount received (PKR) / وصول شدہ رقم
                <input type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Advance (PKR) / پیشگی رقم
                <input type="number" min="0" step="0.01" inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value)} className={inputClass} />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Date / تاریخ
                <input type="date" value={paidDate} onChange={(e) => setPaidOn(e.target.value)} className={inputClass} />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Payment method / ادائیگی کا طریقہ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={method === m.value}
                    onClick={() => setMethod(m.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${method === m.value ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"}`}
                  >
                    {m.en} / {m.ur}
                  </button>
                ))}
              </div>
            </div>
            <MethodFields method={method as PaymentMethod} values={fields} onChange={setFields} />
            {(method === "bank-transfer" || method === "mobile-wallet") && (
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={verifyNow} onChange={(e) => setVerifyNow(e.target.checked)} />
                Verified now (counts in the balance) / ابھی تصدیق کریں
              </label>
            )}
            <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Allocate the payment / ادائیگی کی تقسیم</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={allocationMode === "oldest-first"} onClick={() => setAllocationMode("oldest-first")} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${allocationMode === "oldest-first" ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"}`}>
                  Oldest unpaid month first / سب سے پرانا بقایا پہلے
                </button>
                <button type="button" aria-pressed={allocationMode === "month"} onClick={() => setAllocationMode("month")} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${allocationMode === "month" ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"}`}>
                  Choose the months / مہینے خود چنیں
                </button>
              </div>
              {allocationMode === "oldest-first" ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  The payment settles the oldest unpaid months first, one month at a time. Any amount left over is kept as credit and shown separately.
                </p>
              ) : owedMonths.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">No month has unpaid dues. / کوئی مہینہ بقایا نہیں</p>
              ) : (
                <div className="space-y-2">
                  {owedMonths.map((m) => (
                    <label key={m.month} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span>
                        {monthTitle(m.month)}: unpaid {money(m.remaining)}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={m.remaining}
                        value={monthAmounts[m.month] ?? ""}
                        onChange={(e) => setMonthAmounts((prev) => ({ ...prev, [m.month]: e.target.value }))}
                        className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="0.00"
                      />
                    </label>
                  ))}
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Allocated {money(owedMonths.reduce((sum, m) => sum + (parseFloat(monthAmounts[m.month] ?? "0") || 0), 0))} of {money((parseFloat(amount || "0") || 0) + (parseFloat(advance || "0") || 0))}. The rest is kept as credit.
                  </p>
                </div>
              )}
            </div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Note (optional) / نوٹ
              <VoiceInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. part payment for March fuel" className={inputClass} />
            </label>
            <button type="submit" disabled={busy} className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
              {busy ? "Saving... / محفوظ ہو رہا ہے" : "Record payment / ادائیگی درج کریں"}
            </button>
          </form>
        </Card>
      )}

      {/* Payments in the selected month */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Payments in {monthTitle(selected)} / ادائیگیاں</h3>
        {monthPayments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No payments this month / اس مہینے کوئی ادائیگی نہیں</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {monthPayments.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {money(p.amountReceived)} PKR
                    {p.advancePaid > 0 && <span className="text-blue-700 dark:text-blue-400"> + advance {money(p.advancePaid)}</span>}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {dateOnly(p.date)} · {methodLabel(p.method)} {p.recordedBy ? `· by ${p.recordedBy}` : ""}
                  </p>
                  {p.note && <p className="text-xs text-slate-500">{p.note}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <StatusBadge method={p.method} status={p.status ?? "confirmed"} />
                    <span>{paymentDetail(p)}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {p.allocations && p.allocations.length > 0
                      ? `Applied to: ${p.allocations.map((a) => `${monthTitle(a.month)} ${money(a.amount)}`).join(", ")}`
                      : (p.status ?? "confirmed") === "confirmed" ? "Applied to: earlier record (no allocation list)" : "Not applied to the khata until it is verified"}
                    {(p.unallocated ?? 0) > 0 && ` · credit ${money(p.unallocated)}`}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2 print:hidden">
                  {(p.status ?? "confirmed") === "pending" && (
                    <button type="button" disabled={busy} onClick={() => changeStatus(p, "confirmed")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                      {p.method === "cheque" ? "Mark cleared / کلیئر" : "Verify / تصدیق"}
                    </button>
                  )}
                  {p.method === "cheque" && (p.status === "pending" || p.status === "confirmed") && (
                    <button type="button" disabled={busy} onClick={() => changeStatus(p, "bounced")} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400">
                      Bounced / واپس
                    </button>
                  )}
                  {p.attachmentId ? (
                    <a href={`/api/khata/attachments/${p.attachmentId}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">
                      View image / تصویر
                    </a>
                  ) : (
                    <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">
                      Add image / تصویر شامل کریں
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => addProofLater(p, e.target.files?.[0])} />
                    </label>
                  )}
                  <button type="button" onClick={() => setReceipt(p)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">
                    Receipt / رسید
                  </button>
                  <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200">
                    Edit / ترمیم
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Audit history */}
      <Card className="p-5 print:hidden">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">History of changes / تبدیلیوں کی تاریخ</h3>
        {audit.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No changes recorded yet / ابھی کوئی تبدیلی درج نہیں</p>
        ) : (
          <ul className="max-h-96 divide-y divide-slate-200 overflow-y-auto text-xs dark:divide-slate-700">
            {audit.map((a) => (
              <li key={a._id} className="py-2">
                <p className="font-medium text-slate-900 dark:text-white">
                  {a.type === "payment-recorded" ? "Payment recorded" : a.type === "month-closed" ? `Month ${a.month} closed` : `Payment edited (${a.field})`}
                  {a.monthWasClosed && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] dark:bg-slate-700">closed month</span>}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {a.field ? `${String(a.oldValue ?? "—")} → ${String(a.newValue ?? "—")}` : ""}
                  {a.reason ? ` · reason: ${a.reason}` : ""}
                </p>
                <p className="text-slate-500">
                  {a.editedBy || "—"} · {a.editedAt ? new Date(a.editedAt).toLocaleString() : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Receipt */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:bg-transparent">
          <div className="khata-print-area w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment receipt / ادائیگی کی رسید</h3>
                <p className="text-xs text-slate-500">Receipt no. {receipt._id.slice(-8).toUpperCase()}</p>
              </div>
              <button type="button" onClick={() => setReceipt(null)} className="rounded-lg p-1 text-slate-500 print:hidden" aria-label="Close / بند کریں">
                <IconX size={18} />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Account / کھاتہ</dt><dd className="font-medium text-slate-900 dark:text-white">{clientName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department / شعبہ</dt><dd className="text-slate-900 dark:text-white">{department}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Date / تاریخ</dt><dd className="text-slate-900 dark:text-white">{dateOnly(receipt.date)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Method / طریقہ</dt><dd className="text-slate-900 dark:text-white">{methodLabel(receipt.method)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Amount received / وصول رقم</dt><dd className="font-semibold text-slate-900 dark:text-white">{money(receipt.amountReceived)} PKR</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Advance / پیشگی</dt><dd className="text-slate-900 dark:text-white">{money(receipt.advancePaid)} PKR</dd></div>
              {receipt.note && <div className="flex justify-between gap-4"><dt className="text-slate-500">Note / نوٹ</dt><dd className="text-right text-slate-900 dark:text-white">{receipt.note}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Recorded by / درج کنندہ</dt><dd className="text-slate-900 dark:text-white">{receipt.recordedBy || "—"}</dd></div>
            </dl>
            <button type="button" onClick={() => window.print()} className="mt-5 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white print:hidden">
              Print receipt / رسید پرنٹ کریں
            </button>
          </div>
        </div>
      )}

      {/* Edit a payment */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <form onSubmit={saveEdit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit payment / ادائیگی میں ترمیم</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-500" aria-label="Close / بند کریں">
                <IconX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Amount (PKR)<input type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className={inputClass} /></label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Advance (PKR)<input type="number" min="0" step="0.01" value={editForm.advance} onChange={(e) => setEditForm({ ...editForm, advance: e.target.value })} className={inputClass} /></label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Date<input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputClass} /></label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Method
                <select value={editForm.method} onChange={(e) => setEditForm({ ...editForm, method: e.target.value })} className={inputClass}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.en}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Note<input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className={inputClass} /></label>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Reason for the change (required) / تبدیلی کی وجہ
              <input required value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} className={inputClass} />
            </label>
            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={editForm.confirm} onChange={(e) => setEditForm({ ...editForm, confirm: e.target.checked })} className="mt-0.5" />
              <span>Confirm this change. Required if the payment is in a closed month. Each change is kept in the history. / تصدیق کریں</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                <IconCheck size={14} className="mr-1 inline" /> Save / محفوظ کریں
              </button>
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200">
                Cancel / منسوخ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statement for printing: every month of the account */}
      <div className="khata-print-area hidden print:block">
        <h2 className="text-xl font-bold">{clientName} — khata statement</h2>
        <p className="text-sm">{department} · printed {new Date().toLocaleString()}</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left">Month</th>
              <th className="py-1 text-right">Opening</th>
              <th className="py-1 text-right">Fuel</th>
              <th className="py-1 text-right">Payments</th>
              <th className="py-1 text-right">Advances</th>
              <th className="py-1 text-right">Closing</th>
              <th className="py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...sorted].reverse().map((m) => (
              <tr key={m.month} className="border-b">
                <td className="py-1">{m.month}</td>
                <td className="py-1 text-right">{money(m.openingBalance)}</td>
                <td className="py-1 text-right">{money(m.totalFuel)}</td>
                <td className="py-1 text-right">{money(m.paid)}</td>
                <td className="py-1 text-right">{money(m.advance)}</td>
                <td className="py-1 text-right">{money(m.remaining)}</td>
                <td className="py-1">{MONTH_STATUS_LABELS[m.monthStatus].en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

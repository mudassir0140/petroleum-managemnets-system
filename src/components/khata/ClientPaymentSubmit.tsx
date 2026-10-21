"use client";

// The client's own payment submissions: the same methods and fields as the owner's form. A submission is
// saved as pending and appears in the pump's notifications; it counts once the owner verifies it.
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { METHOD_LABELS, type PaymentMethod } from "@/lib/khata/payments";
import { EMPTY_PAYMENT_FIELDS, FORM_METHODS, MethodFields, StatusBadge, checkFields, uploadProof, type PaymentFieldValues } from "./payment-fields";
import { offlineFetch } from "@/lib/offline/outbox";
import { PAYMENT_TOKEN } from "@/lib/offline/rules";

interface SubmittedPayment {
  _id: string;
  txnId: string;
  method: string;
  methodLabel: string;
  status: string;
  statusLabel: string;
  amountReceived: number;
  advancePaid: number;
  date: string;
  note: string;
  attachmentId: string;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";

// One key per form: a repeated send (for example after a dropped connection) returns the same record.
function newRequestKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function todayPakistan(): string {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

function money(value: number): string {
  return value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ClientPaymentSubmit() {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [advance, setAdvance] = useState("");
  const [date, setDate] = useState(todayPakistan);
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<PaymentFieldValues>(EMPTY_PAYMENT_FIELDS);
  const [requestKey, setRequestKey] = useState(newRequestKey);
  const [payments, setPayments] = useState<SubmittedPayment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPayments() {
    try {
      const response = await fetch("/api/khata/client/payments", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setPayments(Array.isArray(data.payments) ? data.payments : []);
      }
    } catch {
      // The list is loaded again on the next visit.
    }
  }

  // Refreshes the list, so a verification by the pump shows here without a reload.
  useLivePoll(loadPayments, 10000, [], true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const received = parseFloat(amount || "0") || 0;
    const advanced = parseFloat(advance || "0") || 0;
    if (received + advanced <= 0) {
      setError("Enter an amount greater than 0 / رقم 0 سے زیادہ درج کریں");
      return;
    }
    const fieldError = checkFields(method, fields);
    if (fieldError) {
      setError(fieldError);
      return;
    }
    setBusy(true);
    try {
      const response = await offlineFetch("/api/khata/client/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestKey,
          method,
          amountReceived: received,
          advancePaid: advanced,
          date,
          note,
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
        setError(data.error || "Could not submit the payment");
        return;
      }
      let proofError: string | null = null;
      // A queued payment has no id yet: its proof waits for it in the outbox (see outbox.ts).
      if (fields.proof && (data.paymentId || data.queued)) {
        const proofUrl = `/api/khata/client/payments/${data.paymentId ?? PAYMENT_TOKEN}/proof`;
        proofError = await uploadProof(proofUrl, fields.proof, data.queued ? data.offlineId : undefined);
      }
      setAmount("");
      setAdvance("");
      setNote("");
      setFields(EMPTY_PAYMENT_FIELDS);
      setRequestKey(newRequestKey());
      setNotice(
        proofError
          ? `Payment submitted, but the image was not saved: ${proofError}`
          : "Payment submitted. The pump will verify it and it will then show in your khata. / ادائیگی جمع ہو گئی"
      );
      await loadPayments();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addProof(p: SubmittedPayment, file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const failed = await uploadProof(`/api/khata/client/payments/${p._id}/proof`, file);
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    setNotice("Image saved. / تصویر محفوظ ہو گئی");
    await loadPayments();
  }

  return (
    <>
      <Card className="mb-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Submit a payment / ادائیگی جمع کریں</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Your payment is sent to the pump for verification. It is not counted until the pump confirms it.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FORM_METHODS.map((m) => (
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Amount (PKR) / رقم
              <input type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Advance (PKR, optional) / پیشگی
              <input type="number" min="0" step="0.01" inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Date / تاریخ
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
          </div>
          <MethodFields method={method} values={fields} onChange={setFields} />
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Note (optional) / نوٹ
            <input type="text" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {notice && <p className="text-sm text-green-700 dark:text-green-400">{notice}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
            {busy ? "Sending... / بھیجا جا رہا ہے" : "Submit payment / ادائیگی جمع کریں"}
          </button>
        </form>
      </Card>

      {payments.length > 0 && (
        <Card className="mb-6">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your submitted payments / آپ کی جمع شدہ ادائیگیاں</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {payments.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    PKR {money(p.amountReceived)}
                    {p.advancePaid > 0 && <span className="text-blue-700 dark:text-blue-400"> + advance {money(p.advancePaid)}</span>}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {p.date} · {METHOD_LABELS[p.method as PaymentMethod]?.en ?? p.methodLabel} · {p.txnId}
                  </p>
                  <div className="mt-1">
                    <StatusBadge method={p.method} status={p.status} />
                  </div>
                </div>
                {p.method !== "cash" &&
                  (p.attachmentId ? (
                    <a href={`/api/khata/client/attachments/${p.attachmentId}`} target="_blank" rel="noreferrer" className="text-xs text-amber-700 underline dark:text-amber-400">
                      View image
                    </a>
                  ) : (
                    <label className="cursor-pointer text-xs text-amber-700 underline dark:text-amber-400">
                      Add image
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => addProof(p, e.target.files?.[0])} />
                    </label>
                  ))}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

"use client";

import { useActionState, useState } from "react";
import { recordTransactionAction } from "@/lib/cashier/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck, IconWallet } from "@/components/icons";
import type { CashierShiftActionState } from "@/lib/cashier/auth-state";
import type { PaymentMethod } from "@/lib/types";
import type { TransactionCategory } from "@/lib/cashier/types";

const initialState: CashierShiftActionState = {};

const CATEGORY_OPTIONS: { value: TransactionCategory; label: string }[] = [
  { value: "fuel", label: "Fuel Sale" },
  { value: "shop", label: "Shop / Convenience" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

export function TransactionForm({ shiftActive }: { shiftActive: boolean }) {
  const [state, formAction, pending] = useActionState(recordTransactionAction, initialState);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  // React's documented "adjust state during render" pattern for clearing
  // the form fields once a submission succeeds, without an effect.
  const [lastHandledState, setLastHandledState] = useState(state);
  const [resetKey, setResetKey] = useState(0);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success) setResetKey((k) => k + 1);
  }

  if (!shiftActive) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-10 text-center">
        <IconWallet size={24} className="text-ink-muted" />
        <p className="text-sm font-medium text-ink-primary">Start your shift to collect payments</p>
        <p className="text-xs text-ink-muted">Transactions can only be recorded while you have an active shift.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" key={resetKey}>
      {state.error && (
        <div
          className="flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--status-critical) 10%, transparent)", color: "var(--status-critical)" }}
        >
          <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state.success && (
        <div
          className="flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--status-good) 12%, transparent)", color: "var(--status-good-text)" }}
        >
          <IconCheck size={16} className="mt-0.5 shrink-0" />
          <span>Transaction recorded successfully.</span>
        </div>
      )}

      <div>
        <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue="fuel"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Description / Reference
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="e.g. Vehicle LEA-1234, or invoice #"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="amount" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          required
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Payment Method</p>
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "card"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                method === m ? "border-brand-500 bg-brand-500 text-white" : "border-border-subtle text-ink-secondary hover:bg-surface-3"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <input type="hidden" name="paymentMethod" value={method} />
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Recording…" : "Collect Payment"}
      </Button>
    </form>
  );
}

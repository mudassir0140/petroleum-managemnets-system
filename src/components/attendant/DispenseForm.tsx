"use client";

import { useActionState, useMemo, useState } from "react";
import { recordSaleAction } from "@/lib/attendant/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck, IconDroplet } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import type { ShiftActionState } from "@/lib/attendant/auth-state";
import type { FuelType, PaymentMethod } from "@/lib/types";

const initialState: ShiftActionState = {};

export function DispenseForm({
  shiftActive,
  petrolPrice,
  dieselPrice,
}: {
  shiftActive: boolean;
  petrolPrice: number;
  dieselPrice: number;
}) {
  const [state, formAction, pending] = useActionState(recordSaleAction, initialState);
  const [fuel, setFuel] = useState<FuelType>("petrol");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [litres, setLitres] = useState("");

  // Clear the litres field once a submission succeeds, without an effect:
  // this is React's documented "adjust state during render" pattern for
  // resetting state when a value changes (here, when a new action result
  // comes back), rather than syncing with an external system.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success && litres !== "") setLitres("");
  }

  const unitPrice = fuel === "petrol" ? petrolPrice : dieselPrice;
  const estimatedAmount = useMemo(() => {
    const n = Number(litres);
    return Number.isFinite(n) && n > 0 ? n * unitPrice : 0;
  }, [litres, unitPrice]);

  if (!shiftActive) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-10 text-center">
        <IconDroplet size={24} className="text-ink-muted" />
        <p className="text-sm font-medium text-ink-primary">Start your shift to dispense fuel</p>
        <p className="text-xs text-ink-muted">Sales can only be logged while you have an active shift.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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
          <span>Sale logged successfully.</span>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Fuel Type</p>
        <div className="grid grid-cols-2 gap-2">
          {(["petrol", "diesel"] as FuelType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFuel(f)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                fuel === f ? "border-transparent text-white" : "border-border-subtle text-ink-secondary hover:bg-surface-3"
              }`}
              style={fuel === f ? { background: f === "petrol" ? "var(--fuel-petrol)" : "var(--fuel-diesel)" } : undefined}
            >
              <span className="capitalize">{f}</span>
              <span className="text-xs opacity-90">Rs {(f === "petrol" ? petrolPrice : dieselPrice).toFixed(2)}/L</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="fuel" value={fuel} />
      </div>

      <div>
        <label htmlFor="litres" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Litres Dispensed
        </label>
        <input
          id="litres"
          name="litres"
          type="number"
          min="0.1"
          step="0.01"
          placeholder="e.g. 12.5"
          value={litres}
          onChange={(e) => setLitres(e.target.value)}
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

      <div className="flex items-center justify-between rounded-lg bg-surface-3 px-4 py-3">
        <span className="text-xs font-medium text-ink-secondary">Amount</span>
        <span className="text-lg font-semibold tabular-nums text-ink-primary">{formatCurrency(estimatedAmount)}</span>
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Logging sale…" : "Log Sale"}
      </Button>
    </form>
  );
}

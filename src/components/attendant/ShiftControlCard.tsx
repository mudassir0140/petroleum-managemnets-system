"use client";

import { useActionState, useState } from "react";
import { endShiftAction, startShiftAction } from "@/lib/attendant/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconAlertTriangle, IconClock } from "@/components/icons";
import { formatCurrency, formatDateTime, formatLitres, titleCase } from "@/lib/format";
import type { ShiftActionState } from "@/lib/attendant/auth-state";
import type { Shift } from "@/lib/types";
import type { ShiftLog, ShiftTotals } from "@/lib/attendant/types";

const initialState: ShiftActionState = {};

export function ShiftControlCard({
  assignedShift,
  activeShift,
  totals,
}: {
  assignedShift: Shift;
  activeShift: ShiftLog | null;
  totals: ShiftTotals;
}) {
  const [endState, endFormAction, endPending] = useActionState(endShiftAction, initialState);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-ink-muted">
          <IconClock size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">You&apos;re not on shift</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your assigned shift is <span className="font-medium text-ink-secondary">{titleCase(assignedShift)}</span>. Start it to begin dispensing
            and logging sales.
          </p>
        </div>
        <form action={startShiftAction}>
          <Button type="submit" variant="primary" size="md">
            Start {titleCase(assignedShift)} Shift
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-2/50 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="good">Active</Badge>
            <p className="text-sm font-medium text-ink-primary">{titleCase(activeShift.shift)} shift</p>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Started {formatDateTime(activeShift.startedAt)}</p>
        </div>

        <div className="flex gap-6 text-center text-xs">
          <div>
            <p className="text-ink-muted">Litres</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{formatLitres(totals.petrolLitres + totals.dieselLitres)}</p>
          </div>
          <div>
            <p className="text-ink-muted">Revenue</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{formatCurrency(totals.revenueTotal)}</p>
          </div>
          <div>
            <p className="text-ink-muted">Transactions</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{totals.transactionCount}</p>
          </div>
        </div>

        {!confirmingEnd && (
          <Button variant="danger" size="sm" onClick={() => setConfirmingEnd(true)}>
            End Shift
          </Button>
        )}
      </div>

      {confirmingEnd && (
        <form action={endFormAction} className="mt-4 space-y-4 rounded-xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-sm font-semibold text-ink-primary">Shift closing report</p>
          <p className="text-xs text-ink-muted">
            Expected cash from your logged sales: <span className="font-semibold text-ink-primary">{formatCurrency(totals.cashTotal)}</span>. Count
            the drawer and enter the actual amount below.
          </p>

          {endState.error && (
            <div
              className="flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm"
              style={{ background: "color-mix(in srgb, var(--status-critical) 10%, transparent)", color: "var(--status-critical)" }}
            >
              <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{endState.error}</span>
            </div>
          )}

          <div>
            <label htmlFor="cashCounted" className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Cash counted in drawer
            </label>
            <input
              id="cashCounted"
              name="cashCounted"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={totals.cashTotal.toFixed(2)}
              required
              className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Any discrepancies, incidents, or handover notes…"
              className="w-full resize-none rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="md" disabled={endPending}>
              {endPending ? "Submitting…" : "Submit Closing Report"}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setConfirmingEnd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

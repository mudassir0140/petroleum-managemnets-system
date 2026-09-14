"use client";

import { useActionState, useState } from "react";
import { endDutyAction, startDutyAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconAlertTriangle, IconShield } from "@/components/icons";
import { formatDateTime, titleCase } from "@/lib/format";
import type { GuardActionState } from "@/lib/security-guard/auth-state";
import type { Shift } from "@/lib/types";
import type { DailyActivitySummary, DutyLog } from "@/lib/security-guard/types";

const initialState: GuardActionState = {};

export function DutyControlCard({
  assignedShift,
  activeDuty,
  summary,
}: {
  assignedShift: Shift;
  activeDuty: DutyLog | null;
  summary: DailyActivitySummary;
}) {
  const [endState, endFormAction, endPending] = useActionState(endDutyAction, initialState);
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  if (!activeDuty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-ink-muted">
          <IconShield size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">You&apos;re off duty</p>
          <p className="mt-1 text-xs text-ink-muted">
            Your assigned shift is <span className="font-medium text-ink-secondary">{titleCase(assignedShift)}</span>. Start duty to begin
            monitoring and logging security activity.
          </p>
        </div>
        <form action={startDutyAction}>
          <Button type="submit" variant="primary" size="md">
            Start {titleCase(assignedShift)} Duty
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
            <Badge tone="good">On duty</Badge>
            <p className="text-sm font-medium text-ink-primary">{titleCase(activeDuty.shift)} shift</p>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Started {formatDateTime(activeDuty.startedAt)}</p>
        </div>

        <div className="flex gap-6 text-center text-xs">
          <div>
            <p className="text-ink-muted">Visitors</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{summary.visitorsIn}</p>
          </div>
          <div>
            <p className="text-ink-muted">Vehicles</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{summary.vehiclesIn}</p>
          </div>
          <div>
            <p className="text-ink-muted">Checks logged</p>
            <p className="mt-0.5 font-semibold text-ink-primary">{summary.checksLogged}</p>
          </div>
        </div>

        {!confirmingEnd && (
          <Button variant="danger" size="sm" onClick={() => setConfirmingEnd(true)}>
            End Duty
          </Button>
        )}
      </div>

      {confirmingEnd && (
        <form action={endFormAction} className="mt-4 space-y-4 rounded-xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-sm font-semibold text-ink-primary">Duty handover</p>
          <p className="text-xs text-ink-muted">Leave a handover note for the next shift's guard before you end duty.</p>

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
            <label htmlFor="handoverNotes" className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Handover notes (optional)
            </label>
            <textarea
              id="handoverNotes"
              name="handoverNotes"
              rows={2}
              placeholder="Anything the next guard should know — open issues, ongoing checks…"
              className="w-full resize-none rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="md" disabled={endPending}>
              {endPending ? "Submitting…" : "Confirm End of Duty"}
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

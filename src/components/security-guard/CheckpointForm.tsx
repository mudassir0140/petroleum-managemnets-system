"use client";

import { useActionState, useState } from "react";
import { recordCheckAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck, IconShield } from "@/components/icons";
import { SECURITY_CHECKPOINTS, type CheckpointStatus } from "@/lib/security-guard/types";
import type { GuardActionState } from "@/lib/security-guard/auth-state";

const initialState: GuardActionState = {};

export function CheckpointForm({ onDuty }: { onDuty: boolean }) {
  const [state, formAction, pending] = useActionState(recordCheckAction, initialState);
  const [checkpoint, setCheckpoint] = useState<string>(SECURITY_CHECKPOINTS[0]);
  const [status, setStatus] = useState<CheckpointStatus>("ok");
  const [notes, setNotes] = useState("");

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success && notes !== "") setNotes("");
  }

  if (!onDuty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 px-6 py-10 text-center">
        <IconShield size={24} className="text-ink-muted" />
        <p className="text-sm font-medium text-ink-primary">Start duty to log security checks</p>
        <p className="text-xs text-ink-muted">Checkpoint rounds can only be logged while you're on duty.</p>
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
          <span>Check logged.</span>
        </div>
      )}

      <div>
        <label htmlFor="checkpoint" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Checkpoint
        </label>
        <select
          id="checkpoint"
          name="checkpoint"
          value={checkpoint}
          onChange={(e) => setCheckpoint(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {SECURITY_CHECKPOINTS.map((cp) => (
            <option key={cp} value={cp}>
              {cp}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Status</p>
        <div className="grid grid-cols-2 gap-2">
          {(["ok", "issue"] as CheckpointStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                status === s ? "border-transparent text-white" : "border-border-subtle text-ink-secondary hover:bg-surface-3"
              }`}
              style={status === s ? { background: s === "ok" ? "var(--status-good)" : "var(--status-critical)" } : undefined}
            >
              {s === "ok" ? "All clear" : "Issue found"}
            </button>
          ))}
        </div>
        <input type="hidden" name="status" value={status} />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Notes {status === "issue" ? "(required)" : "(optional)"}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required={status === "issue"}
          placeholder={status === "issue" ? "Describe the issue you found…" : "Any observations…"}
          className="w-full resize-none rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Logging…" : "Log Check"}
      </Button>
    </form>
  );
}

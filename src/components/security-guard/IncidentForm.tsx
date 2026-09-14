"use client";

import { useActionState, useState } from "react";
import { recordIncidentAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck } from "@/components/icons";
import { titleCase } from "@/lib/format";
import type { GuardActionState } from "@/lib/security-guard/auth-state";
import type { IncidentSeverity } from "@/lib/security-guard/types";

const initialState: GuardActionState = {};

const SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];

export function IncidentForm() {
  const [state, formAction, pending] = useActionState(recordIncidentAction, initialState);
  const [formKey, setFormKey] = useState(0);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success) setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4">
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
          <span>Incident recorded.</span>
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Incident title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Attempted theft at forecourt"
          required
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="location" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Location <span className="text-ink-muted">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="e.g. Pump 2, Main gate, Cash office"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Severity</p>
        <div className="grid grid-cols-4 gap-2">
          {SEVERITIES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-border-subtle px-2 py-2 text-xs font-medium text-ink-secondary transition-colors has-[:checked]:border-transparent has-[:checked]:bg-brand-500 has-[:checked]:text-white hover:bg-surface-3"
            >
              <input type="radio" name="severity" value={s} defaultChecked={s === "low"} className="sr-only" />
              {titleCase(s)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          What happened
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="Describe the incident — who was involved, what happened, any action taken…"
          className="w-full resize-none rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Recording…" : "Record Incident"}
      </Button>
    </form>
  );
}

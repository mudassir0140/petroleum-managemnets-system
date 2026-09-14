"use client";

import { useActionState, useState } from "react";
import { submitIssueReportAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck } from "@/components/icons";
import { titleCase } from "@/lib/format";
import type { GuardActionState } from "@/lib/security-guard/auth-state";
import type { IssueUrgency } from "@/lib/security-guard/types";

const initialState: GuardActionState = {};

const URGENCIES: IssueUrgency[] = ["low", "medium", "high"];

export function IssueReportForm() {
  const [state, formAction, pending] = useActionState(submitIssueReportAction, initialState);
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
          <span>Issue reported to management.</span>
        </div>
      )}

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="e.g. CCTV camera 2 not recording"
          required
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Urgency</p>
        <div className="grid grid-cols-3 gap-2">
          {URGENCIES.map((u) => (
            <label
              key={u}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-border-subtle px-2 py-2 text-xs font-medium text-ink-secondary transition-colors has-[:checked]:border-transparent has-[:checked]:bg-brand-500 has-[:checked]:text-white hover:bg-surface-3"
            >
              <input type="radio" name="urgency" value={u} defaultChecked={u === "medium"} className="sr-only" />
              {titleCase(u)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          placeholder="Describe the security concern or issue you'd like management to address…"
          className="w-full resize-none rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send Report"}
      </Button>
    </form>
  );
}

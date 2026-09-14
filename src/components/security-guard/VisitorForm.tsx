"use client";

import { useActionState, useState } from "react";
import { checkInVisitorAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck } from "@/components/icons";
import type { GuardActionState } from "@/lib/security-guard/auth-state";

const initialState: GuardActionState = {};

function Field({
  id,
  label,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-secondary">
        {label} {required ? "" : <span className="text-ink-muted">(optional)</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

export function VisitorForm() {
  const [state, formAction, pending] = useActionState(checkInVisitorAction, initialState);
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
          <span>Visitor checked in.</span>
        </div>
      )}

      <Field id="visitorName" label="Visitor name" placeholder="e.g. Fahad Malik" required />
      <Field id="purpose" label="Purpose of visit" placeholder="e.g. Meeting with owner, delivery, maintenance" required />
      <Field id="personToMeet" label="Person to meet" placeholder="e.g. Pump Owner, Manager" />
      <Field id="idNumber" label="ID / CNIC number" placeholder="e.g. 35202-1234567-1" />

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Checking in…" : "Check In Visitor"}
      </Button>
    </form>
  );
}

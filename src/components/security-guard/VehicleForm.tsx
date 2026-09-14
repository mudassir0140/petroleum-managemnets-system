"use client";

import { useActionState, useState } from "react";
import { logVehicleEntryAction } from "@/lib/security-guard/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCheck } from "@/components/icons";
import { titleCase } from "@/lib/format";
import type { GuardActionState } from "@/lib/security-guard/auth-state";
import type { VehicleType } from "@/lib/security-guard/types";

const initialState: GuardActionState = {};

const VEHICLE_TYPES: VehicleType[] = ["car", "motorcycle", "delivery_van", "fuel_tanker", "other"];

export function VehicleForm() {
  const [state, formAction, pending] = useActionState(logVehicleEntryAction, initialState);
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
          <span>Vehicle entry logged.</span>
        </div>
      )}

      <div>
        <label htmlFor="regNumber" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Registration number
        </label>
        <input
          id="regNumber"
          name="regNumber"
          type="text"
          placeholder="e.g. LEA-4521"
          required
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="vehicleType" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Vehicle type
        </label>
        <select
          id="vehicleType"
          name="vehicleType"
          defaultValue="car"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {titleCase(t)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="driverName" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Driver name <span className="text-ink-muted">(optional)</span>
        </label>
        <input
          id="driverName"
          name="driverName"
          type="text"
          placeholder="e.g. Waqas Ali"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label htmlFor="purpose" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Purpose <span className="text-ink-muted">(optional)</span>
        </label>
        <input
          id="purpose"
          name="purpose"
          type="text"
          placeholder="e.g. Fuel delivery, customer, staff pickup"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Logging…" : "Log Vehicle Entry"}
      </Button>
    </form>
  );
}

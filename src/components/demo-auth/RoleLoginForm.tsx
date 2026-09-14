"use client";

import { useActionState } from "react";
import { demoLoginAction } from "@/lib/demo/actions";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle } from "@/components/icons";
import { ROLE_OPTIONS } from "@/lib/demo/roles";
import type { DemoLoginState } from "@/lib/demo/auth-state";

const initialState: DemoLoginState = {};

export function RoleLoginForm() {
  const [state, formAction, pending] = useActionState(demoLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div
          className="flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--status-critical) 10%, transparent)", color: "var(--status-critical)" }}
        >
          <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="role" className="mb-1.5 block text-xs font-medium text-ink-secondary">
          Select your role
        </label>
        <select
          id="role"
          name="role"
          defaultValue=""
          required
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-ink-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            Choose a role…
          </option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="primary" size="md" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Login"}
      </Button>

      <p className="text-center text-xs text-ink-muted">Demo mode — no email or password needed. Pick a role to open its dashboard.</p>
    </form>
  );
}

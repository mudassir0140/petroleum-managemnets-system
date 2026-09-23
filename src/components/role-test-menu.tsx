"use client";

import { useActionState, useRef } from "react";
import { roleTestLoginAction, type RoleTestState } from "@/lib/dev/role-test-actions";
import { ROLES } from "@/lib/roles";

const initialState: RoleTestState = {};

// Demo/testing-only navigation shortcut — lists every existing role and
// opens that role's real, already-built dashboard (see
// lib/dev/role-test-actions.ts). Separate from the normal Login button:
// normal login never shows a role picker, it looks up the account's saved
// role in MongoDB.
export function RoleTestMenu({ className = "" }: { className?: string }) {
  const [state, formAction, pending] = useActionState(roleTestLoginAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className={`relative ${className}`}>
      <form ref={formRef} action={formAction}>
        <select
          name="role"
          defaultValue=""
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
          aria-label="Role Test — open any role's dashboard for demo/testing"
          title="Demo/testing only — jumps straight into a role's dashboard"
          className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <option value="" disabled>
            {pending ? "Opening…" : "Role Test"}
          </option>
          {ROLES.map((role) => (
            <option key={role.slug} value={role.slug}>
              {role.label}
            </option>
          ))}
        </select>
      </form>
      {state.error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      )}
    </div>
  );
}

"use client";

// Enable / Disable, Reset password and Delete for one account on a pump admin card. The username is always shown.
// A new password is shown once, straight after it is set, and is never shown again after a refresh.
import { useState } from "react";
import { ACCOUNT_KINDS, type AccountKind } from "@/lib/account/controls";

export function AccountControls({
  kind,
  id,
  username,
  disabled,
  canResetPassword = false,
  showUsername = true,
  onChanged,
}: {
  kind: AccountKind;
  id: string;
  username?: string;
  disabled?: boolean;
  canResetPassword?: boolean;
  showUsername?: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const label = ACCOUNT_KINDS[kind].label;
  const url = `/api/pumpadmin/accounts/${kind}/${id}`;

  async function run(action: () => Promise<Response>, onDone?: (data: Record<string, unknown>) => void) {
    setBusy(true);
    setError("");
    try {
      const response = await action();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Try again.");
        return;
      }
      onDone?.(data);
      onChanged();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleDisabled() {
    const next = !disabled;
    if (next && !window.confirm(`Disable this ${label.toLowerCase()} login? It cannot log in until it is enabled again.`)) return;
    void run(() =>
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: next }),
        cache: "no-store",
      })
    );
  }

  function resetPassword() {
    if (!window.confirm(`Set a new password for this ${label.toLowerCase()}? The old password stops working.`)) return;
    setCopied(false);
    void run(
      () => fetch(`${url}`, { method: "POST", cache: "no-store" }),
      (data) => setNewPassword(String(data.password ?? ""))
    );
  }

  function remove() {
    if (!window.confirm(`Delete this ${label.toLowerCase()} permanently? This cannot be undone.`)) return;
    void run(() => fetch(url, { method: "DELETE", cache: "no-store" }));
  }

  const button = "rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50";

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        {showUsername && (
          <span className="truncate font-mono text-slate-700 dark:text-slate-300" title="Login username">
            {username || "—"}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            disabled ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {disabled ? "Disabled" : "Active"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={toggleDisabled}
          className={`${button} ${disabled ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400" : "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"}`}
        >
          {disabled ? "Enable" : "Disable"}
        </button>
        {canResetPassword && (
          <button type="button" disabled={busy} onClick={resetPassword} className={`${button} border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300`}>
            Reset password
          </button>
        )}
        <button type="button" disabled={busy} onClick={remove} className={`${button} border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400`}>
          Delete
        </button>
      </div>

      {newPassword && (
        <div className="rounded-md bg-amber-50 p-2 dark:bg-amber-900/20">
          <p className="text-[11px] text-amber-800 dark:text-amber-300">New password (shown once; copy it now):</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-white px-2 py-1 font-mono text-sm text-slate-900 dark:bg-slate-800 dark:text-white">{newPassword}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(newPassword).then(() => setCopied(true));
              }}
              className="rounded border border-slate-300 px-2 py-0.5 text-[11px] dark:border-slate-600"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={() => setNewPassword("")} className="text-[11px] text-slate-500 underline">
              Hide
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

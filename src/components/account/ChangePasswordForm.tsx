"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccountRole } from "@/lib/account/change-password";
import { MAX_PASSWORD_LENGTH, minPasswordLength, newPasswordError } from "@/lib/account/password-rules";

const ROLE_TEXT: Record<AccountRole, { en: string; ur: string; back: string }> = {
  truck: { en: "Truck driver", ur: "ٹرک ڈرائیور", back: "/truck" },
  supplier: { en: "Supplier", ur: "سپلائر", back: "/supplier" },
  attendant: { en: "Attendant", ur: "اٹینڈنٹ", back: "/attendant/dashboard" },
  "pump-owner": { en: "Pump owner", ur: "پمپ مالک", back: "/pumpadmin" },
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

// The one Change Password form. The truck, supplier and attendant pages use it as a page;
// the pump owner uses it inside the Profile panel (embedded: fields only, no page chrome).
export function ChangePasswordForm({ role, embedded = false }: { role: AccountRole; embedded?: boolean }) {
  const text = ROLE_TEXT[role];
  const minLength = minPasswordLength(role);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDone(false);
    const ruleError = newPasswordError(role, newPassword);
    if (ruleError) {
      setError(
        role === "pump-owner"
          ? ruleError
          : `New password must be at least ${minLength} characters / نیا پاس ورڈ کم از کم ${minLength} حروف کا ہو`
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match / نئے پاس ورڈ مختلف ہیں");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not change the password");
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password");
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Current password / موجودہ پاس ورڈ
        <input type="password" autoComplete="current-password" required className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        New password / نیا پاس ورڈ
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          maxLength={MAX_PASSWORD_LENGTH}
          className={inputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </label>
      {role === "pump-owner" && (
        <p className="text-xs text-slate-500 dark:text-slate-400">At least 8 characters, with a letter and a number.</p>
      )}
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Confirm new password / نئے پاس ورڈ کی تصدیق
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          maxLength={MAX_PASSWORD_LENGTH}
          className={inputClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {done && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">Password changed. / پاس ورڈ تبدیل ہو گیا۔</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? "Saving... / محفوظ ہو رہا ہے" : "Save password / پاس ورڈ محفوظ کریں"}
      </button>
    </form>
  );

  if (embedded) return form;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Link href={text.back} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        ← Back / واپس
      </Link>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {text.en} / {text.ur}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Change Password / پاس ورڈ تبدیل کریں</h1>
        {form}
      </div>
    </div>
  );
}

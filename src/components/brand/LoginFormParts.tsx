"use client";

import { useState, type ComponentType } from "react";
import { AlertTriangleIcon, EyeIcon, EyeOffIcon, type IconProps } from "@/components/icons";

// Labeled input for the login forms: 44px tall, icon on the leading edge, and an
// eye toggle on password fields. The toggle only changes the input type.
export function LoginField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  disabled = false,
}: {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          id={id}
          name={id}
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className={`h-11 w-full rounded-xl border border-slate-300 bg-white ps-10 text-base text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 disabled:opacity-60 sm:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600 ${isPassword ? "pe-11" : "pe-3.5"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-xl text-slate-400 transition hover:text-slate-700 focus-visible:text-amber-700 focus-visible:outline-none dark:text-slate-500 dark:hover:text-slate-200 dark:focus-visible:text-amber-400"
          >
            {revealed ? <EyeOffIcon size={18} aria-hidden="true" /> : <EyeIcon size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

// Inline error line. The slot is always rendered with a fixed height, so showing
// or clearing a message does not move the button below it.
export function LoginError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex min-h-5 items-start gap-2 text-sm text-red-600 dark:text-red-400">
      {message && (
        <>
          <AlertTriangleIcon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </>
      )}
    </div>
  );
}

// Full-width primary button. Shows a spinner and "Signing in..." while submitting,
// and is disabled so it cannot be submitted twice.
export function LoginSubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <span>Login</span>
          <span aria-hidden="true" className="opacity-60">/</span>
          <span dir="rtl" lang="ur" className="urdu-font">لاگ ان</span>
        </>
      )}
    </button>
  );
}

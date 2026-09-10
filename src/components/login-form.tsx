"use client";

import { useRouter } from "next/navigation";

export function LoginForm({
  dashboardHref = "/dashboard",
  demoEmail = "owner@petromanage.com",
}: {
  dashboardHref?: string;
  demoEmail?: string;
}) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(dashboardHref);
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          defaultValue={demoEmail}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          defaultValue="demo-password"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
      >
        Sign in
      </button>
    </form>
  );
}

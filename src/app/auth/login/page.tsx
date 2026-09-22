"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropletIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { userLogin } from "@/lib/user/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      // Call MongoDB login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.role === "pump-owner") {
        router.push(data.redirectUrl || "/pump-owner/dashboard");
        return;
      }

      // A pump account matched but login was explicitly blocked (offline
      // pump / deactivated account) — surface that reason instead of
      // falling through to the unrelated legacy login path below.
      if (response.status === 403) {
        setError(data.error || "Login blocked. Contact your administrator.");
        setIsLoading(false);
        return;
      }

      // Not a pump owner account — try the MongoDB employees collection
      // next (employees created via /dashboard/hr/employees). Same
      // single-source-of-truth pattern as the pump-owner check above:
      // the create-employee route writes email/passwordHash/role onto the
      // employee document, so this login reads straight from it.
      const employeeResponse = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        router.push(employeeData.redirectUrl || "/dashboard");
        return;
      }

      // Not an employee account either — fall back to server-side
      // validation for legacy/demo roles (admin, etc.)
      const result = await userLogin(email, password);

      if (result.success && result.dashboardHref) {
        router.push(result.dashboardHref);
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <DropletIcon className="size-5" />
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white">
            PetroManage
          </span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Sign In
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to access your dashboard
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@company.com"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pump Owner Login
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>Pump owners: Enter the email and password provided by your administrator.</p>
            <p>Your credentials were generated when your pump was created.</p>
            <p>Email format: <span className="font-mono">owner@pumpnamegmail.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropletIcon } from "@/components/icons";
import { userLogin } from "@/lib/user/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      // First check localStorage for pump owner accounts (created from /dashboard/pumps)
      if (typeof window !== "undefined") {
        const pumpsData = localStorage.getItem("petromanage:pumps");
        if (pumpsData) {
          const pumps = JSON.parse(pumpsData);
          const pumpAccount = pumps.find(
            (p: any) => p.ownerEmail?.toLowerCase() === email.toLowerCase()
          );

          if (pumpAccount) {
            // Validate password (exact match)
            if (pumpAccount.password !== password) {
              setError("Invalid email or password");
              setIsLoading(false);
              return;
            }

            // Check account status
            if (pumpAccount.accountStatus === "Inactive") {
              setError("This pump account is inactive. Please contact administrator.");
              setIsLoading(false);
              return;
            }

            if (pumpAccount.accountStatus === "Suspended") {
              setError("This pump account has been suspended. Please contact administrator.");
              setIsLoading(false);
              return;
            }

            // Store session
            localStorage.setItem(
              "user-session",
              JSON.stringify({
                email: pumpAccount.ownerEmail,
                role: pumpAccount.role,
                pumpId: pumpAccount.id,
                status: "active",
                loginTime: new Date().toISOString(),
              })
            );

            // For pump owners, also set pump_owner_session and cookie
            if (pumpAccount.role === "pump-owner") {
              localStorage.setItem(
                "pump_owner_session",
                JSON.stringify({
                  pumpId: pumpAccount.id,
                  email: pumpAccount.ownerEmail,
                  role: pumpAccount.role,
                  status: "active",
                })
              );

              // Import and call server action to set cookie
              const { setPumpOwnerSessionCookie } = await import("@/lib/pump-owner/actions");
              await setPumpOwnerSessionCookie(pumpAccount.id, pumpAccount.ownerEmail);
              router.push("/pump-owner/dashboard");
              return;
            }
          }
        }
      }

      // Fall back to server-side validation for other roles (admin, employees, etc.)
      const result = await userLogin(email, password);

      if (result.success && result.dashboardHref) {
        router.push(result.dashboardHref);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                disabled={isLoading}
              />
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

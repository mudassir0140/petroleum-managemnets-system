"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPumpOwnerSessionCookie } from "@/lib/pump-owner/actions";

export function LoginForm({
  dashboardHref = "/dashboard",
  demoEmail = "owner@petromanage.com",
}: {
  dashboardHref?: string;
  demoEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Get all users from localStorage
      if (typeof window === "undefined") {
        throw new Error("Client-side authentication required");
      }

      const usersData = localStorage.getItem("petromanage:users");
      if (!usersData) {
        setError("No accounts found. Please contact administrator.");
        setLoading(false);
        return;
      }

      const users = JSON.parse(usersData);

      // Find user with matching email (case-insensitive for email, exact for password)
      const user = users.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Check password - exact match, no transformation
      if (user.passwordHash !== password) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Check approval status
      if (user.approvalStatus === "pending") {
        setError("Your account is pending admin approval. Please wait for approval.");
        setLoading(false);
        return;
      }

      if (user.approvalStatus === "rejected") {
        setError("Your account has been rejected. Please contact the administrator.");
        setLoading(false);
        return;
      }

      // Store session in localStorage
      localStorage.setItem(
        "user-session",
        JSON.stringify({
          email: user.email,
          role: user.role,
          pumpId: user.pumpId,
          employeeId: user.employeeId,
          status: "active",
          loginTime: new Date().toISOString(),
        })
      );

      // For pump owners, also set server-side cookie and redirect to pump dashboard
      if (user.role === "pump-owner" && user.pumpId) {
        localStorage.setItem(
          "pump_owner_session",
          JSON.stringify({
            pumpId: user.pumpId,
            email: user.email,
            role: user.role,
            status: "active",
          })
        );
        // Set server-side cookie so requirePumpOwnerAuth can read it
        await setPumpOwnerSessionCookie(user.pumpId, user.email);
        router.push("/pump-owner/dashboard");
      } else {
        // Redirect to dashboard for other roles
        router.push(dashboardHref);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

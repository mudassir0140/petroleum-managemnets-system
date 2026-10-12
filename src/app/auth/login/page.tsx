"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DropletIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

// Reads a JSON body without throwing. A crashed or timed-out function returns
// HTML or plain text, which would otherwise land in the generic catch below.
async function readBody(response: Response): Promise<any> {
  return response.json().catch(() => null);
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      // Check if input is email or username
      const isEmail = username.includes("@");

      // Error from the pump-owner or khata attempt, kept so a more specific
      // message can win over the employee check's generic "Account not found"
      let earlierError = "";

      // Try pump owner login if email
      if (isEmail) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password }),
        });

        const data = await readBody(response);

        if (response.ok && data?.role === "pump-owner") {
          router.push(data.redirectUrl || "/pumpadmin");
          return;
        }

        if (response.status === 403) {
          setError(data?.error || "Login blocked. Contact your administrator.");
          setIsLoading(false);
          return;
        }

        earlierError = data?.error || (response.status >= 500 ? "Server/database error. Please try again." : "");
      }

      // Try khata client login (username without @)
      if (!isEmail) {
        const khataResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const khataData = await readBody(khataResponse);

        if (khataResponse.ok && khataData?.role === "khata-client") {
          router.push(khataData.redirectUrl || "/khata-client/dashboard");
          return;
        }

        earlierError = khataData?.error || (khataResponse.status >= 500 ? "Server/database error. Please try again." : "");
      }

      // Try employee login (username or email)
      const employeeResponse = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? username : undefined,
          username: !isEmail ? username : undefined,
          password
        }),
      });

      if (employeeResponse.ok) {
        const employeeData = await readBody(employeeResponse);
        router.push(employeeData?.redirectUrl || "/dashboard");
        return;
      }

      const employeeData = await readBody(employeeResponse);
      const employeeMessage =
        employeeData?.error ||
        (employeeResponse.status >= 500 ? "Server/database error. Please try again." : "Invalid credentials");

      // The employee check only knows its own table, so for a pump-owner or khata
      // login it says "Account not found" even when the account exists with a wrong password.
      const useEarlier = employeeMessage === "Account not found" && earlierError && earlierError !== "Account not found";
      setError(useEarlier ? earlierError : employeeMessage);
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
                Email or Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="you@company.com or employee.pumpname"
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
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconDroplet } from "@/components/icons";

export default function KhataClientLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/khata/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      router.push("/khata-client/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg">
            <IconDroplet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Khata / کھاتہ
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fuel Account Management
          </p>
        </div>

        <Card>
          <CardHeader title="Client Login / کلائنٹ لاگ ان" />
          <form onSubmit={handleLogin} className="space-y-5 p-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Username / صارف نام
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Password / پاس ورڈ
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
          Don't have login credentials?{" "}
          <span className="font-medium">
            Contact your pump station
          </span>
        </p>
      </div>
    </div>
  );
}

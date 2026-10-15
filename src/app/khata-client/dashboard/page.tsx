"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconDroplet, IconLogOut } from "@/components/icons";
import { formatRate } from "@/lib/format";
import { formatPkr } from "@/lib/khata/entry";
import { clearBrowserState } from "@/lib/auth/clear-browser-state";

interface KhataMonth {
  _id: string;
  month: string;
  openingBalance: number;
  totalFuel: number;
  paid: number;
  advance: number;
  remaining: number;
  status: "open" | "closed";
}

interface KhataProfile {
  _id: string;
  clientName: string;
  department: string;
  numberOfVehicles: number;
  vehicleTypes: string[];
  totalFuelAmount: number;
  totalPaid: number;
  advancePaid: number;
  remainingBalance: number;
  months: KhataMonth[];
  entries: Array<{
    _id: string;
    fuelType: string;
    litres: number;
    vehicleNumber: string;
    driverName: string;
    amount: number;
    givenRate: number;
    date: string;
    attendantName: string;
  }>;
  payments: Array<{
    _id: string;
    amountReceived: number;
    advancePaid: number;
    date: string;
    note: string;
  }>;
}

export default function KhataClientDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<KhataProfile | null>(null);
  // Full-page loading screen only for the very first load.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load once when the page opens. No polling: the client reloads manually.
  useEffect(() => {
    loadProfile(true);
  }, []);

  // isFirstLoad: 5 second timeout and the loading screen apply only then.
  // A Reload refreshes in place, with no loading screen.
  async function loadProfile(isFirstLoad: boolean) {
    const controller = new AbortController();
    const timer = isFirstLoad ? setTimeout(() => controller.abort(), 5000) : undefined;

    try {
      const response = await fetch("/api/khata/client/profile", {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/khata-client/login");
          return;
        }
        throw new Error("Failed to load your account");
      }

      const data = await response.json();
      setProfile(data);
      setError("");
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      setError(
        timedOut
          ? "Loading took too long. Please try again. / لوڈ ہونے میں بہت وقت لگا۔ دوبارہ کوشش کریں۔"
          : err instanceof Error
            ? err.message
            : "An error occurred"
      );
    } finally {
      if (timer) clearTimeout(timer);
      if (isFirstLoad) setLoading(false);
    }
  }

  async function handleLogout() {
    // The session cookie is HttpOnly, so the server has to clear it.
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch {
      // Still clear the browser side and leave; the next visit lands on the login page.
    }
    clearBrowserState();
    window.location.replace("/auth/login?logout=1");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center h-64 text-slate-600 dark:text-slate-400">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || "Account not found"}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => loadProfile(false)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Reload / دوبارہ لوڈ کریں
              </button>
              <button
                onClick={() => router.push("/khata-client/login")}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <IconDroplet size={22} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {profile.clientName}
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {profile.department} | {profile.numberOfVehicles} vehicle{profile.numberOfVehicles > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <IconLogOut size={18} />
            Logout
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Fuel Amount</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              PKR {formatRate(profile.totalFuelAmount)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Paid</p>
            <p className="mt-2 text-lg font-semibold text-green-600 dark:text-green-400">
              PKR {formatRate(profile.totalPaid)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Advance Paid</p>
            <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
              PKR {formatRate(profile.advancePaid)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Remaining Balance</p>
            <p className={`mt-2 text-lg font-semibold ${
              (profile.remainingBalance ?? 0) <= 0
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              PKR {formatRate(profile.remainingBalance)}
            </p>
          </Card>
        </div>

        {/* Months Summary */}
        {profile.months && profile.months.length > 0 && (
          <Card className="mb-6">
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Month-wise Accounting / مہینہ وار حساب کتاب
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {profile.months.map((month) => {
                const monthDate = new Date(parseInt(month.month.split("-")[0]), parseInt(month.month.split("-")[1]) - 1);
                const monthName = monthDate.toLocaleDateString("en-US", { year: "numeric", month: "long" });
                const monthEndTotal = (month.openingBalance || 0) + (month.totalFuel || 0);
                const remaining = Math.max(0, monthEndTotal - (month.paid || 0) - (month.advance || 0));

                return (
                  <div key={month._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {monthName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Status: {month.status === "open" ? "Open / کھلا" : "Closed / بند"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          PKR {formatRate(remaining)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Remaining</p>
                      </div>
                    </div>

                    {month.openingBalance > 0 && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Previous Balance: PKR {formatRate(month.openingBalance)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Total Fuel</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          PKR {formatRate(month.totalFuel || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Paid</p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          PKR {formatRate(month.paid || 0)}
                        </p>
                      </div>
                      {(month.advance ?? 0) > 0 && (
                        <>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">Advance</p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                              PKR {formatRate(month.advance || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 dark:text-slate-400">Month End Total</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                              PKR {formatRate(monthEndTotal)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Fuel Entries */}
        {profile.entries.length > 0 && (
          <Card className="mb-6">
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Fuel Entries / ایندھن کی داخلہ
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {profile.entries.map((entry) => {
                const entryDate = new Date(entry.date);
                const dateStr = entryDate.toLocaleDateString();
                const timeStr = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={entry._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {entry.vehicleNumber}
                          </span>
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {entry.fuelType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p>{dateStr} {timeStr}</p>
                          <p>{formatPkr(entry.litres)} L | Driver: {entry.driverName || "N/A"}</p>
                          <p>Attendant: {entry.attendantName || "N/A"} | Rate: PKR {formatPkr(entry.givenRate)}</p>
                        </div>
                      </div>
                      <p className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                        PKR {formatPkr(entry.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Payments */}
        {profile.payments.length > 0 && (
          <Card>
            <div className="border-b border-slate-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Payment History / ادائیگی کی تاریخ
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {profile.payments.map((payment) => (
                <div key={payment._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                      {payment.note && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{payment.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {(payment.amountReceived ?? 0) > 0 && (
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Received: PKR {formatRate(payment.amountReceived)}
                        </p>
                      )}
                      {(payment.advancePaid ?? 0) > 0 && (
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Advance: PKR {formatRate(payment.advancePaid)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {profile.entries.length === 0 && profile.payments.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No fuel entries or payments yet
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

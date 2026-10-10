"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconDroplet } from "@/components/icons";
import { formatCurrency } from "@/lib/format";

interface FuelRates {
  petrolRate: number;
  dieselRate: number;
  updatedAt?: string;
}

export function AttendantHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [rates, setRates] = useState<FuelRates | null>(null);

  // Show back button on all attendant pages except main dashboard
  const isMainDashboard = pathname === "/dashboard/attendant";
  const showBackButton = pathname.startsWith("/dashboard/attendant") && !isMainDashboard;

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRates() {
    try {
      const response = await fetch("/api/attendant/rates");
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    }
  }

  const handleBack = () => {
    // Try to go back, fallback to dashboard if no history
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard/attendant");
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <IconArrowLeft size={16} />
          Back / واپس
        </button>
      )}

      {/* Rates Display */}
      {rates && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
          <p className="mb-3 text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
            Today's Rates / آج کے ریٹ
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded text-amber-600 dark:text-amber-400">
                <IconDroplet size={14} />
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Petrol</p>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Rs {formatCurrency(rates.petrolRate || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded text-green-600 dark:text-green-400">
                <IconDroplet size={14} />
              </div>
              <div>
                <p className="text-xs text-green-700 dark:text-green-300">Diesel</p>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Rs {formatCurrency(rates.dieselRate || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

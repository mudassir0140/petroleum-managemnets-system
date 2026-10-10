"use client";

import { useEffect, useState } from "react";
import { DropletIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";

interface Rates {
  petrolRate: number;
  dieselRate: number;
  updatedAt?: string;
}

export function RatesHeader() {
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    // Fetch rates on mount
    fetchRates();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchRates, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRates() {
    try {
      const response = await fetch("/api/attendant/rates");
      if (response.ok) {
        const data = await response.json();
        setRates({
          petrolRate: data.petrolRate || 0,
          dieselRate: data.dieselRate || 0,
          updatedAt: data.updatedAt,
        });
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  }

  if (!rates) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Today's Rates / آج کے ریٹ
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <DropletIcon className="size-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-300">Petrol</p>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Rs {formatCurrency(rates.petrolRate || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropletIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Diesel</p>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                Rs {formatCurrency(rates.dieselRate || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

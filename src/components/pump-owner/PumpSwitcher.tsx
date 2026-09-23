"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Pump {
  _id: string;
  name: string;
  ownerEmail: string;
}

export function PumpSwitcher({ currentPumpId, ownerEmail }: { currentPumpId: string; ownerEmail: string }) {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadPumps() {
      try {
        const response = await fetch(`/api/admin/pumps?ownerEmail=${encodeURIComponent(ownerEmail)}`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.pumps)) {
          setPumps(data.pumps);
        }
      } catch (error) {
        console.error("Failed to load pumps:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPumps();
  }, [ownerEmail]);

  if (loading || pumps.length <= 1) {
    return null;
  }

  const currentPump = pumps.find((p) => p._id === currentPumpId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        <span>📍 {currentPump?.name || "Select pump"}</span>
        <span className="text-slate-600 dark:text-slate-400">⌄</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50">
          <div className="space-y-1 p-2">
            {pumps.map((pump) => (
              <Link
                key={pump._id}
                href={`/pump-owner/dashboard?pumpId=${pump._id}`}
                onClick={() => setIsOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  pump._id === currentPumpId
                    ? "bg-amber-100 font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {pump.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

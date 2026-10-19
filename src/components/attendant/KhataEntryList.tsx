"use client";

import { offlineFetch } from "@/lib/offline/outbox";
import { useState } from "react";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import {
  type KhataEntry,
  calcKhataAmount,
  formatPkr,
  sumKhataAmounts,
  toSafeNumber,
} from "@/lib/khata/entry";
import { formatDate, formatTime } from "@/lib/format";
import { IconDroplet, IconCalendar } from "@/components/icons";

// Live preview shown while the attendant types litres.
// "Amount = litres × given rate = Rs X" / "رقم = لیٹر × دی گئی شرح = Rs X"
export function KhataAmountPreview({ litres, rate }: { litres: string; rate: number }) {
  const amount = calcKhataAmount(litres, rate);
  return (
    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
      <p className="text-xs text-amber-700 dark:text-amber-300">
        Amount = litres × given rate = Rs {formatPkr(amount)}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-300">
        رقم = لیٹر × دی گئی شرح = Rs {formatPkr(amount)}
      </p>
      <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-100">
        Rs {formatPkr(amount)}
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {formatPkr(litres)} L × Rs {formatPkr(rate)}/L
      </p>
    </div>
  );
}

// Entries for one khata account, newest first, with the running total.
// Refreshes every 5 seconds without overlap, and immediately when refreshKey changes.
export function KhataEntryList({
  khataClientId,
  refreshKey = 0,
}: {
  khataClientId: string;
  refreshKey?: number;
}) {
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useLivePoll(
    async () => {
      const response = await fetch(
        `/api/attendant/khata-entries?khataClientId=${encodeURIComponent(khataClientId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Failed to load entries");
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
      setLoaded(true);
    },
    5000,
    [khataClientId, refreshKey],
    Boolean(khataClientId)
  );

  const total = sumKhataAmounts(entries);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Entries / داخلہ ({entries.length})
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Running total / کل رقم</p>
          <p className="text-base font-bold text-amber-700 dark:text-amber-300">Rs {formatPkr(total)}</p>
        </div>
      </div>

      {!loaded ? (
        <p className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">Loading entries... / لوڈ ہو رہا ہے...</p>
      ) : entries.length === 0 ? (
        <p className="p-4 text-center text-sm text-slate-600 dark:text-slate-400">
          No entries yet / ابھی کوئی داخلہ نہیں
        </p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {entries.map((entry) => (
            <div key={entry._id} className="p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                    <IconCalendar size={14} />
                    {entry.date ? formatDate(entry.date) : "-"} · {entry.date ? formatTime(entry.date) : "-"}
                  </p>
                  <p className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <IconDroplet size={14} />
                    {entry.fuelType || "-"} · {formatPkr(entry.litres)} L
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Vehicle / گاڑی: {entry.vehicleNumber || "-"} · Driver / ڈرائیور: {entry.driverName || "-"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Rate / شرح: Rs {formatPkr(entry.givenRate)}/L
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">
                  Rs {formatPkr(toSafeNumber(entry.amount))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Saves an entry through the attendant API. The server computes the amount and
// returns the stored record, so the success message shows the real saved amount.
export async function saveAttendantKhataEntry(payload: {
  khataClientId: string;
  fuelType: string;
  litres: string;
  givenRate?: string; // optional: callers without one use the account rate
  vehicleNumber: string;
  driverName: string;
}): Promise<{ queued: false; entry: KhataEntry; khataTotalAmount: number } | { queued: true }> {
  const response = await offlineFetch("/api/attendant/khata-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  // Saved on this device while offline. The queue sends it when the connection returns.
  if (response.status === 202 && data.queued) return { queued: true };
  if (!response.ok) throw new Error(data.error || "Failed to create entry");
  return { queued: false, entry: data.entry, khataTotalAmount: toSafeNumber(data.khataTotalAmount) };
}

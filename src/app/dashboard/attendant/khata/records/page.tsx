"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconCalendar, IconDroplet, IconPlus } from "@/components/icons";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { type KhataEntry, formatPkr, sumKhataAmounts, toSafeNumber } from "@/lib/khata/entry";
import { formatDate, formatTime } from "@/lib/format";

// Every Khata record for the accounts Admin assigned to this attendant, newest first.
// Refreshes every 5 seconds, so entries added from the Khata page show up here.
export default function AttendantKhataRecordsPage() {
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // Live list: refresh every 5 seconds from MongoDB, never overlapping requests.
  useLivePoll(async () => {
    try {
      const response = await fetch("/api/attendant/khata-entries", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load khata records");
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoaded(true);
    }
  }, 5000);

  const total = sumKhataAmounts(entries);

  return (
    <div>
      <PageHeader
        title="Khata Records / کھاتہ ریکارڈ"
        description="Khata entries for the accounts assigned to you"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Records: {entries.length} · Total: <span className="font-semibold text-amber-700 dark:text-amber-300">Rs {formatPkr(total)}</span>
        </p>
        <Link
          href="/dashboard/attendant/khata"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <IconPlus size={16} />
          New Entry / نئی انٹری
        </Link>
      </div>

      {!loaded ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">Loading khata records...</div>
      ) : entries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No khata records for your accounts yet / آپ کے کھاتوں کا ابھی کوئی ریکارڈ نہیں
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1 text-xs">
                  <p className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                    <IconCalendar size={14} />
                    {entry.date ? formatDate(entry.date) : "-"} · {entry.date ? formatTime(entry.date) : "-"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.clientName || "-"}</p>
                  <p className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <IconDroplet size={14} />
                    {entry.fuelType || "-"} · {formatPkr(entry.litres)} L · Rate / شرح: Rs {formatPkr(entry.givenRate)}/L
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Vehicle / گاڑی: {entry.vehicleNumber || "-"} · Driver / ڈرائیور: {entry.driverName || "-"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Entered by / درج کنندہ: {entry.attendantName || "-"}
                  </p>
                </div>
                <div className="shrink-0 space-y-2 text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Rs {formatPkr(toSafeNumber(entry.amount))}
                  </p>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      entry.status === "Closed"
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    }`}
                  >
                    {entry.status || "Open"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

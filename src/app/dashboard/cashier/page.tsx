// @ts-nocheck
"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Modal } from "@/components/dashboard/modal";
import { ClipboardIcon, CreditCardIcon, WalletIcon } from "@/components/icons";
import { CASHIER } from "@/lib/dashboard/data/cashier";
import { formatCurrency } from "@/lib/dashboard/format";
import { useCashierShift } from "@/lib/store/use-cashier-shift";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function CashierOverviewPage() {
  const { activeShift, transactions, startShift, submitHandover } = useCashierShift();
  const [showHandover, setShowHandover] = useState(false);
  const [cashCounted, setCashCounted] = useState("");
  const [handoverTo, setHandoverTo] = useState("");
  const [notes, setNotes] = useState("");

  const todayTx = transactions.filter((t) => t.recordedAt.slice(0, 10) === todayKey());
  const todayRevenue = todayTx.reduce((sum, t) => sum + t.amount, 0);
  const todayCash = todayTx.filter((t) => t.paymentMethod === "cash").reduce((sum, t) => sum + t.amount, 0);
  const todayCard = todayTx.filter((t) => t.paymentMethod === "card").reduce((sum, t) => sum + t.amount, 0);

  function handleHandover(event: React.FormEvent) {
    event.preventDefault();
    if (!handoverTo.trim()) return;
    submitHandover(Number(cashCounted) || 0, handoverTo, notes);
    setShowHandover(false);
    setCashCounted("");
    setHandoverTo("");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${CASHIER.name}`} description={`Assigned to ${CASHIER.pumpName}`} />

      <SectionCard>
        <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {activeShift ? "Shift in progress" : "No active shift"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {activeShift
                ? `Started at ${new Date(activeShift.startedAt).toLocaleTimeString()}`
                : "Start your shift to begin collecting payments."}
            </p>
          </div>
          {activeShift ? (
            <button
              type="button"
              onClick={() => setShowHandover(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              End Shift & Handover
            </button>
          ) : (
            <button
              type="button"
              onClick={startShift}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Start Shift
            </button>
          )}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's revenue" value={formatCurrency(todayRevenue)} icon={ClipboardIcon} />
        <StatCard label="Cash collected" value={formatCurrency(todayCash)} icon={WalletIcon} tone="emerald" />
        <StatCard label="Card collected" value={formatCurrency(todayCard)} icon={CreditCardIcon} tone="sky" />
        <StatCard label="Transactions" value={String(todayTx.length)} />
      </div>

      <SectionCard title="Collect a payment" description="Log every transaction as it happens.">
        <div className="p-5">
          <Link
            href="/dashboard/cashier/collect"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <WalletIcon className="size-4" />
            Go to Collect Payment
          </Link>
        </div>
      </SectionCard>

      {showHandover && (
        <Modal title="End Shift & Handover" subtitle="Count the cash drawer before closing" onClose={() => setShowHandover(false)}>
          <form className="space-y-4" onSubmit={handleHandover}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Cash counted (Rs.)</label>
              <input
                required
                type="number"
                min={0}
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Handover to</label>
              <input
                required
                value={handoverTo}
                onChange={(e) => setHandoverTo(e.target.value)}
                placeholder="e.g. Pump Manager"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional handover notes"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Submit Handover
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

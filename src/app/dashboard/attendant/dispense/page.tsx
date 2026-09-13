"use client";

import { useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { currentUnitPrice } from "@/lib/dashboard/data/attendant";
import type { PaymentMethod } from "@/lib/dashboard/data/attendant";
import { FUEL_TYPES, FUEL_TYPE_LABELS, type FuelType } from "@/lib/dashboard/data/stations";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";
import { useAttendantShift } from "@/lib/store/use-attendant-shift";

export default function DispenseFuelPage() {
  const { activeShift, shiftSales, recordSale } = useAttendantShift();
  const [fuel, setFuel] = useState<FuelType>("petrol");
  const [liters, setLiters] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const litersNum = Number(liters) || 0;
  const previewAmount = Math.round(litersNum * currentUnitPrice(fuel));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (litersNum <= 0) return;
    recordSale(fuel, litersNum, paymentMethod);
    setLiters("");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dispense Fuel" description="Log every sale as it happens at the pump." />

      {!activeShift ? (
        <SectionCard>
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No active shift</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start your shift from the Overview page before logging sales.
            </p>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="New sale">
          <form className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel</label>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value as FuelType)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {FUEL_TYPE_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Liters</label>
              <input
                required
                type="number"
                min={0.1}
                step={0.1}
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="e.g. 25"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Amount: <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(previewAmount)}</span>
              </p>
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                Log Sale
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="This shift's sales">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Liters</th>
                <th className="px-5 py-3 font-medium">Unit price</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {shiftSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(sale.recordedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{FUEL_TYPE_LABELS[sale.fuel]}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatLiters(sale.liters)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(sale.unitPrice)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(sale.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={sale.paymentMethod === "cash" ? "success" : "info"}>{sale.paymentMethod}</Badge>
                  </td>
                </tr>
              ))}
              {shiftSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No sales logged yet this shift.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

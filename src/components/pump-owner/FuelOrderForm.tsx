"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";

export function FuelOrderForm({ pumpId, onSuccess }: { pumpId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fuelType: "petrol" as "petrol" | "diesel",
    quantityLitres: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const quantity = Number(form.quantityLitres);
    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pump-owner/fuel-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pumpId,
          fuelType: form.fuelType,
          quantityLitres: quantity,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to request fuel");
      }

      setForm({ fuelType: "petrol", quantityLitres: "", notes: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Request Fuel" subtitle="Order fuel from the company" />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Type</label>
          <select
            value={form.fuelType}
            onChange={(e) => setForm({ ...form, fuelType: e.target.value as "petrol" | "diesel" })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity (Litres)</label>
          <input
            type="number"
            min="1"
            step="100"
            value={form.quantityLitres}
            onChange={(e) => setForm({ ...form, quantityLitres: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="e.g., 1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Any special instructions..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {loading ? "Requesting..." : "Request Fuel"}
        </button>
      </form>
    </Card>
  );
}

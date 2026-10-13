"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconPlus } from "@/components/icons";
import { SUPPLIER_FUEL_LABELS, type SupplierListItem } from "@/lib/supplier/types";
import { SupplierAccountModal } from "./SupplierAccountModal";

export function FuelOrderForm({ pumpId, onSuccess }: { pumpId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);

  // Supplier companies come from MongoDB. Refreshed on load and each time the dropdown opens,
  // so suppliers created since the page loaded appear without a reload.
  async function loadSuppliers() {
    try {
      const response = await fetch("/api/pumpadmin/suppliers", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      // Keep the last list if the refresh fails.
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const [form, setForm] = useState({
    supplierId: "",
    fuelType: "petrol" as "petrol" | "diesel",
    quantityLitres: "",
    notes: "",
  });

  const selectedSupplier = suppliers.find((s) => s._id === form.supplierId);

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
      // A chosen supplier gets the request directly. Otherwise the company order path is used as before.
      const response = selectedSupplier
        ? await fetch("/api/pumpadmin/supplier-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              supplierId: selectedSupplier._id,
              litres: quantity,
              note: form.notes || "",
            }),
          })
        : await fetch("/api/pump-owner/fuel-orders", {
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

      setForm({ supplierId: "", fuelType: "petrol", quantityLitres: "", notes: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Request Fuel"
        subtitle="Order fuel from the company or a supplier"
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            <IconPlus size={14} />
            Create
          </button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Send To</label>
            <select
              value={form.supplierId}
              onFocus={loadSuppliers}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Company (default)</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.companyName} · {SUPPLIER_FUEL_LABELS[s.fuelType]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Type</label>
            {selectedSupplier ? (
              <div className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                {SUPPLIER_FUEL_LABELS[selectedSupplier.fuelType]} (set by supplier)
              </div>
            ) : (
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as "petrol" | "diesel" })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
              </select>
            )}
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {loading ? "Requesting..." : "Request Fuel"}
        </button>
      </form>

      {showCreate && (
        <SupplierAccountModal onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} />
      )}
    </Card>
  );
}

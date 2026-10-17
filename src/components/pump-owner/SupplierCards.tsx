"use client";

import { useState } from "react";
import { SUPPLIER_FUEL_LABELS, type SupplierListItem } from "@/lib/supplier/types";
import { SupplierDetailModal } from "./SupplierDetailModal";

function formatNumber(value: unknown): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Supplier companies shown in Order History. Six per row on a wide desktop screen.
export function SupplierCards({ suppliers, showUpdates = true }: { suppliers: SupplierListItem[]; showUpdates?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (suppliers.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
        No supplier companies yet. Use Create to add one.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {suppliers.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => setSelectedId(s._id)}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/60"
          >
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.companyName}</p>
            <p className="truncate text-xs text-slate-600 dark:text-slate-400">{s.ownerName}</p>
            <span className="mt-2 inline-block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {SUPPLIER_FUEL_LABELS[s.fuelType]}
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Pending requests: {s.summary?.pendingRequests ?? 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pending payment: PKR {formatNumber(s.summary?.pendingAmount)}
            </p>
          </button>
        ))}
      </div>

      {selectedId && (
        <SupplierDetailModal supplierId={selectedId} onClose={() => setSelectedId(null)} showUpdates={showUpdates} />
      )}
    </>
  );
}

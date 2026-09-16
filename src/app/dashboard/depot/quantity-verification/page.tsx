// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CheckCircleIcon, EditIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  LOADING_ORDERS,
  loadingDiscrepancy,
  type LoadingOrder,
} from "@/lib/dashboard/data/loading";
import { FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const REVIEW_STATUSES = ["Loaded", "Verified"] as const;
const DISCREPANCY_TOLERANCE = 100;
const VERIFIER = "Amir Siddiqui";

type VerifyFormState = { loadedLiters: string };

function formFromOrder(order: LoadingOrder): VerifyFormState {
  return { loadedLiters: order.loadedLiters !== null ? String(order.loadedLiters) : "" };
}

export default function DepotQuantityVerificationPage() {
  const [orders, setOrders] = useState<LoadingOrder[]>(LOADING_ORDERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VerifyFormState>({ loadedLiters: "" });

  const forReview = useMemo(
    () => orders.filter((o) => REVIEW_STATUSES.includes(o.status as (typeof REVIEW_STATUSES)[number])),
    [orders],
  );

  const filtered = useMemo(() => {
    return forReview.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.tankerId.toLowerCase().includes(search.toLowerCase()) ||
        o.driver.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || o.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [forReview, search, status]);

  const awaitingVerification = forReview.filter((o) => o.status === "Loaded").length;
  const verified = orders.filter((o) => o.status === "Verified" || o.status === "Dispatched").length;
  const flagged = forReview.filter((o) => {
    const d = loadingDiscrepancy(o);
    return d !== null && Math.abs(d) > DISCREPANCY_TOLERANCE;
  }).length;
  const avgDiscrepancy =
    forReview.reduce((sum, o) => sum + (loadingDiscrepancy(o) ?? 0), 0) / (forReview.length || 1);

  const editing = editingId ? orders.find((o) => o.id === editingId) ?? null : null;

  function openVerify(order: LoadingOrder) {
    setForm(formFromOrder(order));
    setEditingId(order.id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    const loadedLiters = Number(form.loadedLiters) || 0;
    if (loadedLiters <= 0) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingId
          ? {
              ...o,
              loadedLiters,
              status: "Verified",
              verifiedBy: VERIFIER,
              endTime: o.endTime ?? new Date().toTimeString().slice(0, 5),
            }
          : o,
      ),
    );
    setEditingId(null);
    setForm({ loadedLiters: "" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loaded Quantity Verification"
        description="Verify actual loaded litres against each tanker's order before it's cleared for dispatch."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting verification" value={String(awaitingVerification)} icon={CheckCircleIcon} />
        <StatCard label="Verified" value={String(verified)} trend="up" delta="Cleared for dispatch" />
        <StatCard label="Flagged discrepancies" value={String(flagged)} trend={flagged > 0 ? "down" : "up"} delta={flagged > 0 ? `> ${DISCREPANCY_TOLERANCE} L off` : "All within tolerance"} />
        <StatCard
          label="Avg. discrepancy"
          value={`${avgDiscrepancy >= 0 ? "+" : ""}${Math.round(avgDiscrepancy)} L`}
          hint="loaded vs. ordered"
        />
      </div>

      <SectionCard
        title="Loaded tankers"
        description={`Tolerance: ±${DISCREPANCY_TOLERANCE} L before a load is flagged`}
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("loaded-quantity-verification", filtered.map((o) => ({
                ID: o.id,
                Tanker: o.tankerId,
                Driver: o.driver,
                "Fuel Type": FUEL_TYPE_LABELS[o.fuelType],
                "Ordered (L)": o.orderedLiters,
                "Loaded (L)": o.loadedLiters ?? "—",
                "Discrepancy (L)": loadingDiscrepancy(o) ?? "—",
                Status: o.status,
                "Verified By": o.verifiedBy ?? "—",
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search loading ID, tanker or driver…" />
          <FilterSelect value={status} onChange={setStatus} options={[...REVIEW_STATUSES]} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Loading order</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Ordered</th>
                <th className="px-5 py-3 font-medium">Loaded</th>
                <th className="px-5 py-3 font-medium">Discrepancy</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((o) => {
                const discrepancy = loadingDiscrepancy(o);
                const isFlagged = discrepancy !== null && Math.abs(discrepancy) > DISCREPANCY_TOLERANCE;
                return (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{o.id}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <p>{o.tankerId}</p>
                      <p className="text-xs text-slate-400">{o.driver}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.orderedLiters.toLocaleString()} L</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {o.loadedLiters !== null ? `${o.loadedLiters.toLocaleString()} L` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {discrepancy !== null ? (
                        <span
                          className={
                            isFlagged
                              ? "font-medium text-rose-600 dark:text-rose-400"
                              : discrepancy !== 0
                                ? "font-medium text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {discrepancy > 0 ? "+" : ""}
                          {discrepancy.toLocaleString()} L
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={o.status === "Verified" ? "success" : isFlagged ? "danger" : "warning"}>
                        {o.status === "Loaded" ? "Awaiting Verification" : o.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openVerify(o)}
                        aria-label={`Verify ${o.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="size-3.5" />
                        {o.status === "Verified" ? "Edit" : "Verify"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No loading orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {forReview.length} loaded tankers
        </p>
      </SectionCard>

      {editing && (
        <Modal
          title={`Verify ${editing.id}`}
          subtitle={`${editing.tankerId} · ${editing.driver} · ordered ${editing.orderedLiters.toLocaleString()} L`}
          onClose={() => setEditingId(null)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Actual loaded quantity (L)</label>
              <input
                required
                autoFocus
                type="number"
                min={1}
                value={form.loadedLiters}
                onChange={(e) => setForm({ loadedLiters: e.target.value })}
                placeholder="e.g. 14950"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {form.loadedLiters && (
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {(() => {
                    const d = (Number(form.loadedLiters) || 0) - editing.orderedLiters;
                    return `${d > 0 ? "+" : ""}${d.toLocaleString()} L vs. order${Math.abs(d) > DISCREPANCY_TOLERANCE ? " — exceeds tolerance" : ""}`;
                  })()}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Confirm Verification
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

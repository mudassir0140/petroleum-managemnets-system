"use client";

import { useCallback, useEffect, useState } from "react";
import { IconEye, IconEyeOff, IconX } from "@/components/icons";
import {
  SUPPLIER_FUEL_LABELS,
  SUPPLIER_REQUEST_LABELS,
  type SupplierDelivery,
  type SupplierNotification,
  type SupplierPayment,
  type SupplierProfile,
  type SupplierRequest,
  type SupplierRequestStatus,
  type SupplierSummary,
} from "@/lib/supplier/types";

interface SupplierDetail {
  supplier: SupplierProfile;
  summary: SupplierSummary;
  requests: SupplierRequest[];
  deliveries: SupplierDelivery[];
  payments: SupplierPayment[];
  notifications: SupplierNotification[];
}

const STATUS_STYLE: Record<SupplierRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatNumber(value: unknown): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// showUpdates: the supplier's own update list. Pump admin turns it off because those
// updates appear in the header notification bell instead.
export function SupplierDetailModal({
  supplierId,
  onClose,
  showUpdates = true,
}: {
  supplierId: string;
  onClose: () => void;
  showUpdates?: boolean;
}) {
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ username: string; password: string } | null>(null);
  const [resetError, setResetError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/pumpadmin/suppliers/${supplierId}`, { cache: "no-store", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to load supplier");
      setError("");
      setDetail({
        supplier: data.supplier,
        summary: data.summary ?? {
          requestedLitres: 0,
          deliveredLitres: 0,
          deliveredAmount: 0,
          receivedAmount: 0,
          pendingAmount: 0,
          pendingRequests: 0,
        },
        requests: Array.isArray(data.requests) ? data.requests : [],
        deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],
        payments: Array.isArray(data.payments) ? data.payments : [],
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetResult(null);
    setResetting(true);
    try {
      const response = await fetch(`/api/pumpadmin/suppliers/${supplierId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to set password");
      setResetResult({ username: data.username, password: data.password });
      setNewPassword("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setResetting(false);
    }
  }

  const supplier = detail?.supplier;
  const summary = detail?.summary;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-lg dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{supplier?.companyName ?? "Supplier"}</h2>
            {supplier && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {SUPPLIER_FUEL_LABELS[supplier.fuelType]} supplier
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                load();
              }}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Refresh / تازہ کریں
            </button>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Close">
              <IconX size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
          {loading && !detail && <p className="text-sm text-slate-600 dark:text-slate-400">Loading supplier details...</p>}

          {supplier && (
            <>
              <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Owner name</p>
                  <p className="font-medium text-slate-900 dark:text-white">{supplier.ownerName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Company name</p>
                  <p className="font-medium text-slate-900 dark:text-white">{supplier.companyName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Username</p>
                  <p className="font-mono font-medium text-slate-900 dark:text-white">{supplier.username || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fuel supplied</p>
                  <p className="font-medium text-slate-900 dark:text-white">{SUPPLIER_FUEL_LABELS[supplier.fuelType] ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="font-medium text-slate-900 dark:text-white">{supplier.location || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="font-medium text-slate-900 dark:text-white">{supplier.contact || "—"}</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Password management</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Passwords are stored securely and cannot be displayed. Set a new one below, or leave it blank to generate one.
                  The supplier is signed out after a reset.
                </p>

                {resetResult && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                    <p>
                      New password for <span className="font-mono font-semibold">{resetResult.username}</span>:{" "}
                      <span className="font-mono font-semibold">{resetResult.password}</span>
                    </p>
                    <p className="mt-1 text-xs">Copy it now. It will not be shown again.</p>
                  </div>
                )}
                {resetError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{resetError}</div>}

                <form onSubmit={handleResetPassword} className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="min-w-[12rem] flex-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">New password (optional)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {resetting ? "Saving..." : "Set password"}
                  </button>
                </form>
              </section>

              {summary && (
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Requested (L)</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatNumber(summary.requestedLitres)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Supplied (L)</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatNumber(summary.deliveredLitres)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Delivered (PKR)</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatNumber(summary.deliveredAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Received (PKR)</p>
                    <p className="mt-1 font-semibold text-green-600 dark:text-green-400">{formatNumber(summary.receivedAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Pending (PKR)</p>
                    <p className="mt-1 font-semibold text-amber-600 dark:text-amber-400">{formatNumber(summary.pendingAmount)}</p>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Fuel requests and status</h3>
                {detail?.requests.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No requests sent to this supplier yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-800">
                    {detail?.requests.map((r) => (
                      <div key={r._id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatNumber(r.litres)} L {SUPPLIER_FUEL_LABELS[r.fuelType]}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Requested {formatDate(r.requestedAt)} · Supplied {formatNumber(r.deliveredLitres)} L
                            {(r.advanceAmount ?? 0) > 0 && ` · Advance PKR ${formatNumber(r.advanceAmount)}`}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                          {SUPPLIER_REQUEST_LABELS[r.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Deliveries</h3>
                {detail?.deliveries.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No deliveries recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-800">
                    {detail?.deliveries.map((d) => (
                      <div key={d._id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                        <span className="text-slate-900 dark:text-white">
                          {formatNumber(d.litres)} L @ PKR {formatNumber(d.ratePerLitre)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          PKR {formatNumber(d.amount)} · {formatDate(d.deliveredAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Received payments</h3>
                {detail?.payments.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No payments recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-800">
                    {detail?.payments.map((p) => (
                      <div key={p._id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">PKR {formatNumber(p.amount)}</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatDate(p.paidAt)}
                          {p.note ? ` · ${p.note}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {showUpdates && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Supplier updates</h3>
                {detail?.notifications.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No updates yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-800">
                    {detail?.notifications.map((n) => (
                      <div key={n._id} className="p-3 text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

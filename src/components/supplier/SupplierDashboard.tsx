"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconBell, IconLogOut } from "@/components/icons";
import {
  EMPTY_SUPPLIER_SUMMARY,
  SUPPLIER_FUEL_LABELS,
  SUPPLIER_REQUEST_LABELS,
  type SupplierDelivery,
  type SupplierNotification,
  type SupplierPayment,
  type SupplierProfile,
  type SupplierRequest,
  type SupplierSummary,
} from "@/lib/supplier/types";
import { formatPkr } from "@/lib/supplier/money";

const REFRESH_MS = 15000;
const FIRST_LOAD_TIMEOUT_MS = 5000;

interface PumpBreakdown {
  pumpId: string;
  pumpName: string;
  summary: SupplierSummary;
}

interface DashboardData {
  supplier: SupplierProfile;
  summary: SupplierSummary;
  pumps: PumpBreakdown[];
  requests: SupplierRequest[];
  deliveries: SupplierDelivery[];
  payments: SupplierPayment[];
  notifications: SupplierNotification[];
  unreadCount: number;
}

const STATUS_STYLE: Record<SupplierRequest["status"], string> = {
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

function DetailCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60 ${className}`}>
      <dt className="text-xs text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function SupplierDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const [deliveryForm, setDeliveryForm] = useState({ requestId: "", litres: "", ratePerLitre: "", deliveredOn: "", note: "" });
  const [paymentForm, setPaymentForm] = useState({ pumpId: "", amount: "", paidOn: "", note: "" });

  // Loads the dashboard. Silent refreshes keep what's on screen and never show a spinner.
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch("/api/supplier/dashboard", { cache: "no-store", credentials: "include", signal });
        if (response.status === 401) {
          router.push("/auth/login");
          return false;
        }
        if (!response.ok) throw new Error("Failed to load your dashboard");
        const json = (await response.json()) as DashboardData;
        setData({
          ...json,
          summary: json.summary ?? { ...EMPTY_SUPPLIER_SUMMARY },
          requests: Array.isArray(json.requests) ? json.requests : [],
          deliveries: Array.isArray(json.deliveries) ? json.deliveries : [],
          payments: Array.isArray(json.payments) ? json.payments : [],
          notifications: Array.isArray(json.notifications) ? json.notifications : [],
          unreadCount: json.unreadCount ?? 0,
        });
        setError("");
        return true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Loading took too long. Tap Reload to try again.");
        } else {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
        return false;
      }
    },
    [router]
  );

  // First load only: 5 second timeout, spinner shown only here.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FIRST_LOAD_TIMEOUT_MS);
    load(controller.signal).finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });
    return () => clearTimeout(timer);
  }, [load]);

  // Quiet background refresh so new requests appear without a manual reload.
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [loading, load]);

  async function handleReload() {
    setMessage("");
    await load();
  }

  async function handleRespond(requestId: string, action: "accept" | "reject") {
    setBusyId(requestId);
    setMessage("");
    try {
      await postJson(`/api/supplier/requests/${requestId}`, { action });
      setMessage(action === "accept" ? "Request accepted. The pump has been notified." : "Request rejected. The pump has been notified.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusyId("");
    }
  }

  async function handleRecordDelivery(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      await postJson("/api/supplier/deliveries", {
        requestId: deliveryForm.requestId,
        litres: deliveryForm.litres,
        ratePerLitre: deliveryForm.ratePerLitre,
        deliveredOn: deliveryForm.deliveredOn || undefined,
        note: deliveryForm.note,
      });
      setDeliveryForm({ requestId: "", litres: "", ratePerLitre: "", deliveredOn: "", note: "" });
      setMessage("Delivery recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      await postJson("/api/supplier/payments", {
        pumpId: paymentForm.pumpId,
        amount: paymentForm.amount,
        paidOn: paymentForm.paidOn || undefined,
        note: paymentForm.note,
      });
      setPaymentForm({ pumpId: "", amount: "", paidOn: "", note: "" });
      setMessage("Payment recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleMarkRead() {
    try {
      await postJson("/api/supplier/notifications/read", {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleLogout() {
    await fetch("/api/supplier/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-600 dark:text-slate-400">
        Loading your dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error || "Dashboard not available"}</p>
        <button
          onClick={handleReload}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Reload / دوبارہ لوڈ کریں
        </button>
      </div>
    );
  }

  const summary = data.summary ?? EMPTY_SUPPLIER_SUMMARY;
  const fulfilable = data.requests.filter(
    (r) => r.status === "accepted" && (r.litres ?? 0) - (r.deliveredLitres ?? 0) > 0
  );
  const selectedRequest = fulfilable.find((r) => r._id === deliveryForm.requestId);
  const remainingForSelected = selectedRequest ? (selectedRequest.litres ?? 0) - (selectedRequest.deliveredLitres ?? 0) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.supplier.companyName}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.supplier.ownerName} · {SUPPLIER_FUEL_LABELS[data.supplier.fuelType]} supplier · {data.supplier.location}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Username: {data.supplier.username}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReload}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reload / دوبارہ لوڈ کریں
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconLogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
      {message && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">{message}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Requested litres</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatNumber(summary.requestedLitres)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Delivered litres</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatNumber(summary.deliveredLitres)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Delivered amount</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">PKR {formatNumber(summary.deliveredAmount)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Received</p>
          <p className="mt-2 text-lg font-semibold text-green-600 dark:text-green-400">PKR {formatNumber(summary.receivedAmount)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Pending payment</p>
          <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">PKR {formatNumber(summary.pendingAmount)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="By pump" subtitle="Requests, deliveries and payments for each pump" />
        {data.pumps.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No pump has sent you a request yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.pumps.map((p) => (
              <div key={p.pumpId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-semibold text-slate-900 dark:text-white">{p.pumpName || "Pump"}</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Delivered {formatNumber(p.summary?.deliveredLitres)} L · PKR {formatNumber(p.summary?.deliveredAmount)} · Received PKR{" "}
                  {formatNumber(p.summary?.receivedAmount)} ·{" "}
                  <span className="font-medium text-amber-600 dark:text-amber-400">Pending PKR {formatNumber(p.summary?.pendingAmount)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Notifications"
          subtitle={`${data.unreadCount ?? 0} unread`}
          action={
            (data.unreadCount ?? 0) > 0 ? (
              <button onClick={handleMarkRead} className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400">
                Mark all as read
              </button>
            ) : undefined
          }
        />
        {data.notifications.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No notifications yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.notifications.map((n) => (
              <div key={n._id} className="flex gap-3 py-3">
                <IconBell size={16} className={n.readAt ? "mt-0.5 text-slate-400" : "mt-0.5 text-amber-500"} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.readAt ? "text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>{n.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Fuel requests" subtitle="Accept or reject new requests from pumps" />
        {data.requests.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.requests.map((r) => (
              <div key={r._id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {r.pumpName} · {SUPPLIER_FUEL_LABELS[r.fuelType]}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Requested {formatDate(r.requestedAt)} · Delivered {formatNumber(r.deliveredLitres)} L
                    </p>
                    {r.note && <p className="text-xs text-slate-500">Note: {r.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                      {SUPPLIER_REQUEST_LABELS[r.status]}
                    </span>
                    {r.status === "pending" && (
                      <>
                        <button
                          disabled={busyId === r._id}
                          onClick={() => handleRespond(r._id, "accept")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          disabled={busyId === r._id}
                          onClick={() => handleRespond(r._id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <DetailCard label="Litres · لیٹر" value={`${formatNumber(r.litres)} L`} />
                  <DetailCard label="Market rate (per litre) · مارکیٹ ریٹ" value={formatPkr(r.marketRate)} />
                  <DetailCard label="Offered rate (per litre) · پیش کردہ ریٹ" value={formatPkr(r.offeredRate)} />
                  <DetailCard label="Amount · رقم" value={formatPkr(r.amount)} />
                  <DetailCard label="Advance · ایڈوانس" value={formatPkr(r.advanceAmount)} />
                  <DetailCard label="Date and time · تاریخ اور وقت" value={formatDate(r.fuelDateTime ?? r.requestedAt)} />
                  <DetailCard label="Tanker detail · ٹینکر کی تفصیل" value={r.tankerDetail || "—"} className="col-span-2 lg:col-span-4" />
                </dl>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Record delivery" subtitle="Log litres delivered against an accepted request" />
          {fulfilable.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Accept a request to record a delivery.</p>
          ) : (
            <form onSubmit={handleRecordDelivery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Request</label>
                <select
                  value={deliveryForm.requestId}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, requestId: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Select a request</option>
                  {fulfilable.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.pumpName} · {formatNumber((r.litres ?? 0) - (r.deliveredLitres ?? 0))} L left
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Litres delivered{selectedRequest ? ` (max ${formatNumber(remainingForSelected)})` : ""}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryForm.litres}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, litres: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rate per litre (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryForm.ratePerLitre}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, ratePerLitre: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Delivery date (optional)</label>
                <input
                  type="date"
                  value={deliveryForm.deliveredOn}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveredOn: e.target.value })}
                  className={inputClass}
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                Save delivery
              </button>
            </form>
          )}
        </Card>

        <Card>
          <CardHeader title="Record received payment" subtitle={`Pending: PKR ${formatNumber(summary.pendingAmount)}`} />
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pump that paid</label>
              <select
                value={paymentForm.pumpId}
                onChange={(e) => setPaymentForm({ ...paymentForm, pumpId: e.target.value })}
                className={inputClass}
                required
              >
                <option value="">Select a pump</option>
                {data.pumps.map((p) => (
                  <option key={p.pumpId} value={p.pumpId}>
                    {p.pumpName || "Pump"} · pending PKR {formatNumber(p.summary?.pendingAmount)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount received (PKR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date (optional)</label>
                <input
                  type="date"
                  value={paymentForm.paidOn}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidOn: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Note (optional)</label>
              <input
                type="text"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                className={inputClass}
              />
            </div>
            <button type="submit" className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Save payment
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader title="Deliveries" subtitle="Every delivery recorded for your company" />
        {data.deliveries.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No deliveries recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.deliveries.map((d) => (
              <div key={d._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="text-slate-900 dark:text-white">
                  {formatNumber(d.litres)} L {SUPPLIER_FUEL_LABELS[d.fuelType]} @ PKR {formatNumber(d.ratePerLitre)}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  PKR {formatNumber(d.amount)} · {formatDate(d.deliveredAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Received payments" subtitle="Payments you have recorded from the pump" />
        {data.payments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.payments.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-green-600 dark:text-green-400">PKR {formatNumber(p.amount)}</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {formatDate(p.paidAt)}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

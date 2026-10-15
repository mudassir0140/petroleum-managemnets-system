"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Card, CardHeader } from "@/components/ui/Card";
import { RouteSvg } from "@/components/pump-owner/truck/RouteSvg";
import { TruckMapPanel } from "@/components/pump-owner/truck/TruckMapPanel";
import { CheckCircleIcon, LogOutIcon, MapPinIcon, PlusIcon, TruckIcon, WalletIcon, XCircleIcon } from "@/components/icons";
import type { RouteResult } from "@/lib/truck/route";
import {
  SUPPLIER_FUEL_LABELS,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_TRUCK_TYPES,
  SUPPLIER_TRUCK_TYPE_LABELS,
  type SupplierRequestStatus,
  type SupplierRequestView,
  type SupplierTruckType,
  type SupplierTruckView,
} from "@/lib/supplier/types";

type SupplierRoute = Pick<RouteResult, "geometry" | "origin" | "destination" | "distanceKm" | "durationMin">;
type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const STATUS_STYLE: Record<SupplierRequestStatus, string> = {
  sent: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "on-the-way": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "pending-driver": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "driver-rejected": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "pending-supplier": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "supplier-rejected": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  arrived: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const innerCard = "rounded-xl border border-slate-200 p-4 dark:border-slate-700";

// Money and litres: a missing value shows a dash, never 0 and never a crash.
function money(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`
    : "—";
}

function litres(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} L` : "—";
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// Text typed into a number box. Empty or non-numeric text gives null.
function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function callApi<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, { cache: "no-store", credentials: "include", ...init });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: response.status, error: typeof body?.error === "string" ? body.error : "Something went wrong" };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: "Network error. Try again." };
  }
}

function TruckBadge({ busy }: { busy: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        busy ? "bg-red-600 text-white" : "bg-green-600 text-white"
      }`}
    >
      {busy ? "Busy / مصروف" : "Free / خالی"}
    </span>
  );
}

// The supplier's dashboard: payment totals, trucks, and the requests from pumps.
// The server filters everything by the signed-in supplier, so only their own data is returned.
export function SupplierInbox({ name, companyName, advance = 0 }: { name: string; companyName: string; advance?: number }) {
  const router = useRouter();
  // ?request=<id> comes from a notification: scroll to that request and highlight it for a few seconds.
  const searchParams = useSearchParams();
  const focusId = searchParams.get("request") ?? "";
  const [dismissedId, setDismissedId] = useState("");
  const flashId = focusId && focusId !== dismissedId ? focusId : "";
  const [requests, setRequests] = useState<SupplierRequestView[]>([]);
  const [trucks, setTrucks] = useState<SupplierTruckView[]>([]);
  const [routes, setRoutes] = useState<Record<string, SupplierRoute | null>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [rates, setRates] = useState<Record<string, string>>({});
  const [chosenTruck, setChosenTruck] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<Record<string, string>>({});
  const [newTruckNumber, setNewTruckNumber] = useState("");
  const [newTruckType, setNewTruckType] = useState<SupplierTruckType | "">("");
  const [newDriverName, setNewDriverName] = useState("");

  useEffect(() => {
    if (!focusId || !loaded) return;
    const scroll = setTimeout(() => {
      document.getElementById(`request-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    const clear = setTimeout(() => setDismissedId(focusId), 4000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [focusId, loaded]);
  const routeRequested = useRef<Set<string>>(new Set());
  // Set by the effect below, so actions can refresh the dashboard straight away.
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  // Live updates: the dashboard refreshes in the background every 10 seconds.
  useEffect(() => {
    async function refresh() {
      const [requestResult, truckResult] = await Promise.all([
        callApi<SupplierRequestView[]>("/api/supplier/requests"),
        callApi<SupplierTruckView[]>("/api/supplier/trucks"),
      ]);
      if (!requestResult.ok && requestResult.status === 401) {
        router.push("/auth/login");
        return;
      }
      // A failed refresh keeps the last list on screen.
      if (requestResult.ok) setRequests(requestResult.data);
      if (truckResult.ok) setTrucks(truckResult.data);
      setLoaded(true);
    }
    refreshRef.current = refresh;
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [router]);

  // The route is fetched once per request that is On the way, not on every refresh.
  useEffect(() => {
    for (const r of requests) {
      if (r.status !== "on-the-way" || routeRequested.current.has(r.id)) continue;
      routeRequested.current.add(r.id);
      callApi<{ route: SupplierRoute | null }>(`/api/supplier/requests/${r.id}/route`).then((result) => {
        setRoutes((prev) => ({ ...prev, [r.id]: result.ok ? result.data.route : null }));
      });
    }
  }, [requests]);

  // Runs one action, shows any error, and refreshes the dashboard on success.
  async function run(key: string, url: string, body: unknown): Promise<boolean> {
    setBusy(key);
    setError("");
    const result = await callApi<unknown>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy("");
    if (!result.ok) {
      if (result.status === 401) {
        router.push("/auth/login");
        return false;
      }
      setError(result.error);
      return false;
    }
    await refreshRef.current();
    return true;
  }

  async function accept(r: SupplierRequestView) {
    // The owner already set the rate on a request the driver accepted, so accepting needs no rate.
    if (r.status === "pending-supplier") {
      await run(`accept:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "accept" });
      return;
    }
    const rate = toNumber(rates[r.id] ?? "");
    if (rate === null || rate <= 0) {
      setError("Enter the rate per litre / فی لیٹر ریٹ درج کریں");
      return;
    }
    await run(`accept:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "accept", ratePerLitre: rate });
  }

  async function reject(r: SupplierRequestView) {
    await run(`reject:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "reject" });
  }

  async function assign(r: SupplierRequestView) {
    const truckId = chosenTruck[r.id];
    if (!truckId) {
      setError("Choose a Free truck / خالی ٹرک چنیں");
      return;
    }
    if (await run(`assign:${r.id}`, `/api/supplier/requests/${r.id}/assign`, { truckId })) {
      setChosenTruck((prev) => ({ ...prev, [r.id]: "" }));
    }
  }

  async function deliver(r: SupplierRequestView) {
    await run(`deliver:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "deliver" });
  }

  async function addTruck() {
    const number = newTruckNumber.trim();
    const driver = newDriverName.trim();
    if (!number) return setError("Enter the truck number / ٹرک نمبر درج کریں");
    if (!newTruckType) return setError("Choose the truck type / ٹرک کی قسم چنیں");
    if (!driver) return setError("Enter the driver name / ڈرائیور کا نام درج کریں");
    if (await run("add-truck", "/api/supplier/trucks", { truckNumber: number, truckType: newTruckType, driverName: driver })) {
      setNewTruckNumber("");
      setNewTruckType("");
      setNewDriverName("");
    }
  }

  async function recordPayment(r: SupplierRequestView) {
    const amount = toNumber(payments[r.id] ?? "");
    if (amount === null || amount <= 0) {
      setError("Enter an amount greater than 0 / رقم 0 سے زیادہ درج کریں");
      return;
    }
    if (await run(`pay:${r.id}`, "/api/supplier/payments", { requestId: r.id, amount })) {
      setPayments((prev) => ({ ...prev, [r.id]: "" }));
    }
  }

  async function logout() {
    await fetch("/api/supplier/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    // Full page load, so Back cannot show the dashboard from memory.
    window.location.replace("/auth/login?logout=1");
  }

  // Totals come from the request records. Missing amounts count as nothing, never as a crash.
  const totals = requests.reduce(
    (acc, r) => {
      if (r.amount !== null) acc.total += r.amount;
      acc.received += r.paid ?? 0;
      if (r.remaining !== null) acc.remaining += r.remaining;
      return acc;
    },
    { total: 0, received: 0, remaining: 0 }
  );

  const freeTruckCount = trucks.filter((t) => !t.busy).length;
  const billedRequests = requests.filter((r) => r.amount !== null);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{companyName || name || "Supplier"}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{name}</p>
          <p className="text-xs text-slate-500">Supplier dashboard / سپلائر ڈیش بورڈ</p>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell listUrl="/api/supplier/notifications" readUrlBase="/api/supplier/notifications" />
          <Link href="/change-password?role=supplier" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
            Change Password / پاس ورڈ تبدیل کریں
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOutIcon size={18} />
            Logout / لاگ آؤٹ
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

      {/* Payment totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3 p-5">
            <WalletIcon size={24} className="text-blue-600" />
            <div>
              <p className="text-xs text-slate-500">Total Amount / کل رقم</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{money(totals.total)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-5">
            <CheckCircleIcon size={24} className="text-green-600" />
            <div>
              <p className="text-xs text-slate-500">Received / وصول شدہ</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{money(totals.received)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-5">
            <XCircleIcon size={24} className="text-red-600" />
            <div>
              <p className="text-xs text-slate-500">Remaining / باقی</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{money(totals.remaining)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trucks */}
      <Card>
        <CardHeader title="Your trucks / آپ کے ٹرک" subtitle={`${freeTruckCount} free of ${trucks.length} / ${trucks.length} میں سے ${freeTruckCount} خالی`} />
        <div className="space-y-4 p-5">
          {trucks.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No trucks yet. Add one below. / ابھی کوئی ٹرک نہیں۔ نیچے شامل کریں۔</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trucks.map((t) => (
                <div key={t.id} className={innerCard}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TruckIcon size={18} className="text-slate-500" />
                      <p className="font-semibold text-slate-900 dark:text-white">{t.truckNumber}</p>
                    </div>
                    <TruckBadge busy={t.busy} />
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {t.truckType ? `${SUPPLIER_TRUCK_TYPE_LABELS[t.truckType].en} / ${SUPPLIER_TRUCK_TYPE_LABELS[t.truckType].ur}` : "—"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Driver / ڈرائیور: {t.driverName || "—"}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add a truck */}
          <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Add a truck / ٹرک شامل کریں</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Type / قسم</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {SUPPLIER_TRUCK_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={newTruckType === type}
                      onClick={() => setNewTruckType(type)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        newTruckType === type
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {SUPPLIER_TRUCK_TYPE_LABELS[type].en} / {SUPPLIER_TRUCK_TYPE_LABELS[type].ur}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  Truck number / ٹرک نمبر
                  <input className={inputClass} value={newTruckNumber} onChange={(e) => setNewTruckNumber(e.target.value)} maxLength={20} />
                </label>
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  Driver name / ڈرائیور کا نام
                  <input className={inputClass} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} maxLength={80} />
                </label>
              </div>
              <button
                type="button"
                disabled={busy === "add-truck"}
                onClick={addTruck}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon size={16} />
                {busy === "add-truck" ? "Adding... / شامل ہو رہا ہے" : "Add truck / ٹرک شامل کریں"}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Requests */}
      <Card>
        <CardHeader title="Requests / درخواستیں" subtitle="Fuel requests from pumps. Updates every 10 seconds / پمپس کی درخواستیں" />
        <div className="space-y-4 p-5">
          {!loaded ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading... / لوڈ ہو رہا ہے</p>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">No requests yet / ابھی کوئی درخواست نہیں</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">New fuel requests from pumps will appear here. / نئی درخواستیں یہاں ظاہر ہوں گی۔</p>
            </div>
          ) : (
            requests.map((r) => {
              const route = routes[r.id];
              const freeTrucks = trucks.filter((t) => !t.busy);
              const selected = chosenTruck[r.id] ?? "";
              const pending = r.status === "sent" || r.status === "seen";
              return (
                <div key={r.id} id={`request-${r.id}`} className={`${innerCard} space-y-3 ${flashId === r.id ? "ring-2 ring-amber-400" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{r.pumpName || "Pump / پمپ"}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {SUPPLIER_FUEL_LABELS[r.fuelType]?.en ?? "—"} / {SUPPLIER_FUEL_LABELS[r.fuelType]?.ur ?? "—"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {litres(r.litres)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Date / تاریخ: {formatDate(r.sentAt)}</p>
                      {r.note && <p className="text-xs text-slate-500">{r.note}</p>}
                      {r.offeredRate !== null && (
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                          Market / مارکیٹ: {money(r.marketRate)} · Offered / پیش کردہ: {money(r.offeredRate)} · Advance / پیشگی: {money(r.requestAdvance)} · Amount / رقم: {money(r.amount)}
                        </p>
                      )}
                      {r.truckId && r.truckNumber && (
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                          Truck / ٹرک: {r.truckNumber} · Driver / ڈرائیور: {r.driverName || "—"}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.sent}`}>
                      {SUPPLIER_STATUS_LABELS[r.status]?.en ?? r.status} / {SUPPLIER_STATUS_LABELS[r.status]?.ur ?? ""}
                    </span>
                  </div>

                  {focusId === r.id && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-900/20">
                      <p className="mb-2 font-semibold text-slate-900 dark:text-white">Request details / درخواست کی تفصیل</p>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                        <div>
                          <dt className="text-slate-500">Pump / پمپ</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">{r.pumpName || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Fuel type / ایندھن کی قسم</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">
                            {SUPPLIER_FUEL_LABELS[r.fuelType]?.en ?? "—"} / {SUPPLIER_FUEL_LABELS[r.fuelType]?.ur ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Quantity / مقدار</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">{litres(r.litres)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Advance / پیشگی رقم</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">Rs {Number(advance || 0).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Selected account / منتخب اکاؤنٹ</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">{companyName || name || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Status / حیثیت</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">
                            {SUPPLIER_STATUS_LABELS[r.status]?.en ?? r.status} / {SUPPLIER_STATUS_LABELS[r.status]?.ur ?? ""}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Sent / بھیجا گیا</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">{formatDate(r.sentAt)}</dd>
                        </div>
                        {r.note && (
                          <div className="col-span-2 sm:col-span-3">
                            <dt className="text-slate-500">Note / نوٹ</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{r.note}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Sent or Seen: Confirm (with the rate) or Reject */}
                  {pending && (
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="text-xs text-slate-600 dark:text-slate-400">
                        Rate per litre (Rs) / فی لیٹر ریٹ
                        <input
                          inputMode="decimal"
                          className={`${inputClass} w-40`}
                          value={rates[r.id] ?? ""}
                          onChange={(e) => setRates((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => accept(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon size={16} />
                        Confirm / تصدیق کریں
                      </button>
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => reject(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircleIcon size={16} />
                        Reject / مسترد کریں
                      </button>
                    </div>
                  )}

                  {/* Accepted: pick a Free truck, then confirm (requests sent on a pump truck already have one) */}
                  {r.status === "accepted" && !r.truckId && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Amount / رقم: {money(r.amount)} · {money(r.ratePerLitre)} per litre / فی لیٹر
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Choose a Free truck / خالی ٹرک چنیں</p>
                      {trucks.length === 0 ? (
                        <p className="text-xs text-slate-600 dark:text-slate-400">Add a truck above first. / پہلے اوپر ٹرک شامل کریں۔</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {trucks.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              disabled={t.busy || busy !== ""}
                              aria-pressed={selected === t.id}
                              onClick={() => setChosenTruck((prev) => ({ ...prev, [r.id]: t.id }))}
                              className={`rounded-xl border p-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
                                selected === t.id ? "border-blue-600 ring-2 ring-blue-500" : "border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-slate-900 dark:text-white">{t.truckNumber}</p>
                                <TruckBadge busy={t.busy} />
                              </div>
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {t.truckType ? SUPPLIER_TRUCK_TYPE_LABELS[t.truckType].en : "—"} · Driver / ڈرائیور: {t.driverName || "—"}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={!selected || busy !== "" || freeTrucks.length === 0}
                        onClick={() => assign(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                      >
                        <TruckIcon size={16} />
                        Confirm truck / ٹرک کی تصدیق کریں
                      </button>
                    </div>
                  )}

                  {/* Waiting for the supplier: the driver accepted, so Accept or Reject */}
                  {r.status === "pending-supplier" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => accept(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon size={16} />
                        Accept / قبول کریں
                      </button>
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => reject(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircleIcon size={16} />
                        Reject / مسترد کریں
                      </button>
                    </div>
                  )}

                  {r.status === "accepted" && r.truckId && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Accepted / قبول · Truck / ٹرک: {r.truckNumber} · Driver / ڈرائیور: {r.driverName || "—"}
                    </p>
                  )}

                  {/* Fuel delivery on a pump truck: dispatch, live position and the two confirmations */}
                  {r.truckId && (r.status === "accepted" || r.status === "on-the-way" || r.status === "arrived" || r.status === "completed") && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Truck / ٹرک: {r.truckNumber || "—"} · Driver / ڈرائیور: {r.driverName || "—"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Dispatched / روانہ: {formatDate(r.dispatchedAt)} · Arrived / پہنچا: {formatDate(r.arrivedAt)} · Travelled / طے شدہ: {r.travelledKm === null ? "—" : `${r.travelledKm} km`}
                      </p>
                      <TruckMapPanel src={`/api/fuel-requests/${r.id}/live`} compact />
                      {r.status === "accepted" && (
                        <button
                          type="button"
                          disabled={busy !== ""}
                          onClick={() => run(`dispatch:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "dispatch" })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                        >
                          <TruckIcon size={16} />
                          Dispatch truck / ٹرک روانہ کریں
                        </button>
                      )}
                      {r.status === "arrived" && !r.supplierConfirmedAt && (
                        <button
                          type="button"
                          disabled={busy !== ""}
                          onClick={() => run(`confirm:${r.id}`, `/api/supplier/requests/${r.id}`, { action: "confirm" })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircleIcon size={16} />
                          Confirm delivery / ترسیل کی تصدیق کریں
                        </button>
                      )}
                      {r.status === "arrived" && r.supplierConfirmedAt && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">You confirmed. Waiting for the pump owner. / آپ نے تصدیق کر دی۔ پمپ مالک کا انتظار۔</p>
                      )}
                      {r.status === "completed" && (
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Delivery completed / ترسیل مکمل</p>
                      )}
                    </div>
                  )}

                  {/* On the way: truck, route, and Mark delivered (older requests only) */}
                  {r.status === "on-the-way" && !r.truckId && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Truck / ٹرک: {r.truckNumber || "—"} · Driver / ڈرائیور: {r.driverName || "—"}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Amount / رقم: {money(r.amount)}
                      </p>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <MapPinIcon size={14} />
                          Delivery route / ترسیل کا راستہ
                        </p>
                        {route === undefined ? (
                          <p className="text-xs text-slate-600 dark:text-slate-400">Loading route... / راستہ لوڈ ہو رہا ہے</p>
                        ) : route ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              {route.distanceKm} km · about {route.durationMin} min
                            </p>
                            <RouteSvg route={route} caption="From the supplier to the pump / سپلائر سے پمپ تک" />
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Route unavailable / راستہ دستیاب نہیں</p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => deliver(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon size={16} />
                        Mark delivered / پہنچا دیا
                      </button>
                    </div>
                  )}

                  {r.status === "delivered" && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Delivered by {r.truckNumber || "—"} / ڈیلیور ہوا · Amount / رقم: {money(r.amount)}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Payments per request */}
      <Card>
        <CardHeader title="Payments / ادائیگیاں" subtitle="Amount, paid and remaining for each request / ہر درخواست کی رقم، ادا شدہ اور باقی" />
        <div className="space-y-3 p-5">
          {billedRequests.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No amounts yet. Accept a request and enter its rate. / ابھی کوئی رقم نہیں۔</p>
          ) : (
            billedRequests.map((r) => (
              <div key={r.id} className={innerCard}>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <div>
                    <p className="text-xs text-slate-500">Pump / پمپ</p>
                    <p className="font-medium text-slate-900 dark:text-white">{r.pumpName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Litres / لیٹر</p>
                    <p className="font-medium text-slate-900 dark:text-white">{litres(r.litres)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Amount / رقم</p>
                    <p className="font-medium text-slate-900 dark:text-white">{money(r.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paid / ادا</p>
                    <p className="font-medium text-slate-900 dark:text-white">{money(r.paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Remaining / باقی</p>
                    <p className="font-medium text-slate-900 dark:text-white">{money(r.remaining)}</p>
                  </div>
                </div>
                {r.remaining !== null && r.remaining > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400">
                      Received now (Rs) / ابھی وصول ہوئی
                      <input
                        inputMode="decimal"
                        className={`${inputClass} w-40`}
                        value={payments[r.id] ?? ""}
                        onChange={(e) => setPayments((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy !== ""}
                      onClick={() => recordPayment(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-200 dark:text-slate-900"
                    >
                      <WalletIcon size={16} />
                      Record payment / ادائیگی درج کریں
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

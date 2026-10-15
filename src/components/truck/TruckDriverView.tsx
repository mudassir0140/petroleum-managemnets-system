"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, MapPinIcon, TruckIcon, WalletIcon, ClockIcon, CheckCircleIcon } from "@/components/icons";
import { TRUCK_TYPE_LABELS, type TruckOrderView, type TruckTripView, type TruckType } from "@/lib/truck/types";

interface DriverTruck {
  id: string;
  driverName: string;
  truckNumber: string;
  truckType: TruckType | "";
  availability: "free" | "busy";
  currentTrip: TruckTripView | null;
}

interface RouteView {
  distanceKm: number;
  durationMin: number;
  currentRoad: string | null;
  originSource: "live-location" | "pickup-pump";
}

type LoadState = "loading" | "ready" | "error";
type StatusFilter = "all" | "awaiting" | "active" | "delivered" | "cancelled";

const LOCATION_INTERVAL_MS = 20000;
const REFRESH_INTERVAL_MS = 15000;

// Order statuses grouped the way the driver thinks about them.
const ACTIVE_STATUSES = new Set(["accepted", "dispatched", "on-the-way"]);
const DELIVERED_STATUSES = new Set(["delivered", "completed", "payment-pending", "paid", "cleared"]);

const FILTERS: { key: StatusFilter; en: string; ur: string }[] = [
  { key: "all", en: "All", ur: "سب" },
  { key: "awaiting", en: "Awaiting answer", ur: "جواب باقی" },
  { key: "active", en: "Active", ur: "فعال" },
  { key: "delivered", en: "Delivered", ur: "پہنچا دیا" },
  { key: "cancelled", en: "Cancelled", ur: "منسوخ" },
];

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatShortDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function litres(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} L` : "—";
}

// Local calendar day as yyyy-mm-dd, used to group orders by day.
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function matchesFilter(order: TruckOrderView, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "awaiting") return order.driverResponse === "pending" && order.status !== "cancelled";
  if (filter === "active") return ACTIVE_STATUSES.has(order.status);
  if (filter === "delivered") return DELIVERED_STATUSES.has(order.status);
  return order.status === "cancelled";
}

function matchesSearch(order: TruckOrderView, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return [order.orderNumber, order.pickupPump, order.destinationPump, order.fuelType, order.status].some((field) =>
    (field ?? "").toLowerCase().includes(q)
  );
}

// Totals and chart data, all computed from the real order list. Nothing is invented.
function summarize(orders: TruckOrderView[]) {
  let litresDelivered = 0;
  let active = 0;
  let awaiting = 0;
  let confirmed = 0;
  const byStatus = { awaiting: 0, active: 0, delivered: 0, cancelled: 0 };
  for (const o of orders) {
    if (DELIVERED_STATUSES.has(o.status)) {
      litresDelivered += Number.isFinite(o.quantityLitres) ? o.quantityLitres : 0;
      byStatus.delivered++;
    } else if (o.status === "cancelled") {
      byStatus.cancelled++;
    } else if (ACTIVE_STATUSES.has(o.status)) {
      active++;
      byStatus.active++;
    }
    if (o.driverResponse === "pending" && o.status !== "cancelled") {
      awaiting++;
      byStatus.awaiting++;
    }
    if (o.driverConfirmed) confirmed++;
  }
  return { total: orders.length, litresDelivered, active, awaiting, confirmed, byStatus };
}

// Litres per day for the last 7 days, by the day each order was requested.
function litresLastWeek(orders: TruckOrderView[]) {
  const days: { key: string; label: string; litres: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: "short" }), litres: 0 });
  }
  const index = new Map(days.map((d, i) => [d.key, i]));
  for (const o of orders) {
    const date = new Date(o.requestedAt);
    if (Number.isNaN(date.getTime())) continue;
    const i = index.get(dayKey(date));
    if (i !== undefined && Number.isFinite(o.quantityLitres)) days[i].litres += o.quantityLitres;
  }
  return days;
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{icon}</div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

// Status counts as horizontal bars. Widths are relative to the largest count.
function StatusBars({ counts }: { counts: { awaiting: number; active: number; delivered: number; cancelled: number } }) {
  const rows = [
    { label: "Awaiting answer / جواب باقی", value: counts.awaiting, color: "bg-amber-500" },
    { label: "Active / فعال", value: counts.active, color: "bg-cyan-500" },
    { label: "Delivered / پہنچا دیا", value: counts.delivered, color: "bg-green-500" },
    { label: "Cancelled / منسوخ", value: counts.cancelled, color: "bg-red-500" },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{r.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{r.value}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-2.5 rounded-full ${r.color}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Litres per day as a column chart, drawn in SVG so no chart library is needed.
function WeekChart({ days }: { days: { label: string; litres: number }[] }) {
  const W = 420, H = 180, PAD = 24;
  const max = Math.max(1, ...days.map((d) => d.litres));
  const slot = (W - PAD * 2) / days.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" role="img" aria-label="Litres per day for the last 7 days">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-slate-300 dark:stroke-slate-700" />
      {days.map((d, i) => {
        const h = (d.litres / max) * (H - PAD * 2);
        const x = PAD + i * slot + slot * 0.2;
        return (
          <g key={d.label + i}>
            <rect x={x} y={H - PAD - h} width={slot * 0.6} height={Math.max(h, 0)} rx={4} className="fill-blue-500" />
            <text x={x + slot * 0.3} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400">
              {d.label}
            </text>
            <text x={x + slot * 0.3} y={H - PAD - h - 4} textAnchor="middle" className="fill-slate-700 text-[10px] dark:fill-slate-300">
              {d.litres > 0 ? d.litres.toLocaleString() : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

// The driver's own truck and trips. Location is sent only when the driver allows it.
export function TruckDriverView({ driverName, truckNumber }: { driverName: string; truckNumber: string }) {
  const router = useRouter();
  const [truck, setTruck] = useState<DriverTruck | null>(null);
  const [orders, setOrders] = useState<TruckOrderView[]>([]);
  const [route, setRoute] = useState<RouteView | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const lastSent = useRef(0);
  // Browser support is read from the environment, not stored in state, so no effect has to set it.
  const geoSupported = useSyncExternalStore(
    () => () => undefined,
    () => typeof navigator !== "undefined" && !!navigator.geolocation,
    () => true
  );

  async function load() {
    try {
      const response = await fetch("/api/truck/me", { cache: "no-store", credentials: "include" });
      if (response.status === 401) return router.push("/auth/login");
      if (!response.ok) throw new Error(`The server returned ${response.status}`);
      const data = await response.json();
      setTruck(data.truck ?? null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setLoadState("ready");
      setError("");
      setUpdatedAt(new Date());

      const r = await fetch("/api/truck/route", { cache: "no-store", credentials: "include" });
      const rd = r.ok ? await r.json() : null;
      setRoute(rd?.route ?? null);
    } catch {
      // Keep the last data on screen; only show the error when there is nothing yet.
      setError("Could not load your dashboard. It will retry automatically.");
      setLoadState((current) => (current === "loading" ? "error" : current));
    }
  }

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live location: asked for once, sent every 20 seconds while this page is open.
  useEffect(() => {
    if (!geoSupported) return;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setPermission("granted");
        if (Date.now() - lastSent.current < LOCATION_INTERVAL_MS) return;
        lastSent.current = Date.now();
        await fetch("/api/truck/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        }).catch(() => undefined);
      },
      () => setPermission("denied"),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [geoSupported]);

  async function logout() {
    await fetch("/api/truck/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    // Full page load, so Back cannot show the dashboard from memory.
    window.location.replace("/auth/login?logout=1");
  }

  // Accept or reject an assigned trip, or confirm the delivery. The server checks each step.
  async function act(orderId: string, action: "accept" | "reject" | "confirm") {
    setBusyId(orderId);
    setActionError("");
    try {
      const url = action === "confirm" ? `/api/truck/orders/${orderId}/confirm` : `/api/truck/orders/${orderId}/respond`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(action === "confirm" ? {} : { action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The request failed");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setBusyId("");
    }
  }

  const trip = truck?.currentTrip ?? null;
  const summary = useMemo(() => summarize(orders), [orders]);
  const week = useMemo(() => litresLastWeek(orders), [orders]);
  const visible = useMemo(
    () => orders.filter((o) => matchesFilter(o, filter) && matchesSearch(o, search.trim())),
    [orders, filter, search]
  );

  const header = (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Truck dashboard / ٹرک ڈیش بورڈ</p>
        <h1 className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{driverName || "Driver"}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>
            Truck / ٹرک: {truck?.truckNumber || truckNumber || "—"}
            {truck?.truckType ? ` · ${TRUCK_TYPE_LABELS[truck.truckType].en} / ${TRUCK_TYPE_LABELS[truck.truckType].ur}` : ""}
          </span>
          {truck && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${truck.availability === "busy" ? "bg-red-600" : "bg-green-600"}`}
            >
              {truck.availability === "busy" ? "Busy / مصروف" : "Free / خالی"}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()} · ` : ""}Refreshes every 15 seconds / ہر 15 سیکنڈ بعد تازہ
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Link href="/change-password?role=truck" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
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
    </header>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {header}

        {loadState === "error" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
              Retry / دوبارہ کوشش
            </button>
          </div>
        )}
        {loadState !== "error" && error && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{error}</div>}

        {loadState === "loading" ? (
          <Skeleton />
        ) : loadState === "error" && !truck ? null : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<TruckIcon size={20} />} label="Total deliveries / کل ترسیلات" value={String(summary.total)} hint="All orders for this truck" />
              <StatCard icon={<WalletIcon size={20} />} label="Litres delivered / پہنچائے گئے لیٹر" value={litres(summary.litresDelivered)} hint="Delivered and completed orders" />
              <StatCard icon={<ClockIcon size={20} />} label="Active trips / فعال سفر" value={String(summary.active)} hint="Accepted and on the way" />
              <StatCard
                icon={<CheckCircleIcon size={20} />}
                label="Awaiting your answer / آپ کا جواب باقی"
                value={String(summary.awaiting)}
                hint={`${summary.confirmed} delivery confirmations by you`}
              />
            </div>

            {/* Charts and live panels */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="grid grid-cols-1 gap-6 lg:col-span-2">
                <Panel title="Litres per day / روزانہ لیٹر" subtitle="Last 7 days, by request date / پچھلے 7 دن">
                  {orders.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">No orders in the last 7 days. / پچھلے 7 دنوں میں کوئی آرڈر نہیں۔</p>
                  ) : (
                    <WeekChart days={week} />
                  )}
                </Panel>
                <Panel title="Deliveries by status / ترسیل کی حالت" subtitle="Counts from your order list / آرڈر کی گنتی">
                  {orders.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No deliveries yet. / ابھی کوئی ترسیل نہیں۔</p>
                  ) : (
                    <StatusBars counts={summary.byStatus} />
                  )}
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title="Current trip / موجودہ سفر">
                  {!trip ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No active trip. / کوئی فعال سفر نہیں۔</p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {trip.fuelType === "diesel" ? "Diesel / ڈیزل" : "Petrol / پیٹرول"} · {litres(trip.quantityLitres)}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">Pickup / لوڈنگ: {trip.pickupPump || "—"}</p>
                      <p className="text-slate-700 dark:text-slate-300">Destination / منزل: {trip.destinationPump || "—"}</p>
                      <p className="text-slate-700 dark:text-slate-300">Expected arrival / متوقع وقت: {formatDate(trip.expectedArrival)}</p>
                      <p className="text-slate-700 dark:text-slate-300">Order status / حالت: {trip.orderStatus || "—"}</p>
                      {trip.driverResponse === "pending" && (
                        <p className="font-medium text-amber-700 dark:text-amber-400">Awaiting your answer: accept or reject in the table below. / آپ کا جواب باقی ہے۔</p>
                      )}
                    </div>
                  )}
                </Panel>

                <Panel title="Route / راستہ">
                  {!trip ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Route appears when a trip is active. / سفر فعال ہونے پر راستہ ظاہر ہوگا۔</p>
                  ) : route ? (
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      <p>
                        {route.distanceKm} km · about {route.durationMin} min
                      </p>
                      <p>Current road / موجودہ سڑک: {route.currentRoad ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        {route.originSource === "live-location" ? "From your live location" : "From the pickup pump (no location yet)"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Route not available right now. / راستہ ابھی دستیاب نہیں۔</p>
                  )}
                </Panel>

                <Panel title="Location / مقام">
                  <p className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <MapPinIcon size={16} className="mt-0.5 shrink-0" />
                    <span>
                      {permission === "granted" && "Sharing your location while this page is open. / مقام شیئر ہو رہا ہے۔"}
                      {permission === "denied" && "Location permission was denied. Allow it in your browser to share your location. / مقام کی اجازت نہیں دی گئی۔"}
                      {!geoSupported && "This browser cannot share location. / یہ براؤزر مقام شیئر نہیں کر سکتا۔"}
                      {geoSupported && permission === "unknown" && "Waiting for location permission. / مقام کی اجازت کا انتظار ہے۔"}
                    </span>
                  </p>
                </Panel>
              </div>
            </div>

            {/* Deliveries table */}
            <Panel title="Deliveries / ترسیلات" subtitle="Search and filter your orders / اپنے آرڈر تلاش اور فلٹر کریں">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={filter === f.key}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        filter === f.key
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {f.en} / {f.ur}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order, pump or fuel / تلاش کریں"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 lg:w-72 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {actionError && <p className="mb-3 text-sm text-red-700 dark:text-red-300">{actionError}</p>}

              {orders.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
                  No deliveries yet. Trips assigned to your truck will appear here. / ابھی کوئی ترسیل نہیں۔
                </p>
              ) : visible.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">No deliveries match this search or filter. / کوئی ترسیل نہیں ملی۔</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="py-3 pr-3 font-semibold">Order / آرڈر</th>
                        <th className="py-3 pr-3 font-semibold">Fuel / ایندھن</th>
                        <th className="py-3 pr-3 text-right font-semibold">Litres / لیٹر</th>
                        <th className="py-3 pr-3 font-semibold">Route / راستہ</th>
                        <th className="py-3 pr-3 font-semibold">Status / حالت</th>
                        <th className="py-3 pr-3 font-semibold">Requested / تاریخ</th>
                        <th className="py-3 pr-3 font-semibold">Expected / متوقع</th>
                        <th className="py-3 font-semibold">Action / عمل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {visible.map((o) => (
                        <tr key={o.orderId} className="align-top">
                          <td className="py-3 pr-3 font-mono text-xs text-slate-900 dark:text-white">{o.orderNumber}</td>
                          <td className="py-3 pr-3 capitalize text-slate-700 dark:text-slate-300">{o.fuelType}</td>
                          <td className="py-3 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{litres(o.quantityLitres)}</td>
                          <td className="py-3 pr-3 text-slate-700 dark:text-slate-300">
                            {o.pickupPump || "—"} → {o.destinationPump || "—"}
                          </td>
                          <td className="py-3 pr-3">
                            <StatusChip order={o} />
                          </td>
                          <td className="py-3 pr-3 text-xs text-slate-600 dark:text-slate-400">{formatShortDate(o.requestedAt)}</td>
                          <td className="py-3 pr-3 text-xs text-slate-600 dark:text-slate-400">{formatDate(o.expectedArrival)}</td>
                          <td className="py-3">
                            <OrderActions order={o} busy={busyId === o.orderId} onAct={act} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function StatusChip({ order }: { order: TruckOrderView }) {
  if (order.status === "cancelled") {
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelled / منسوخ</span>;
  }
  if (order.driverResponse === "pending") {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Awaiting answer / جواب باقی</span>;
  }
  if (DELIVERED_STATUSES.has(order.status)) {
    return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">{order.status}</span>;
  }
  return <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">{order.status || "—"}</span>;
}

// Accept and Reject for a trip waiting on the driver; Confirm delivery once an accepted trip is delivered.
function OrderActions({
  order,
  busy,
  onAct,
}: {
  order: TruckOrderView;
  busy: boolean;
  onAct: (orderId: string, action: "accept" | "reject" | "confirm") => void;
}) {
  if (order.driverResponse === "pending" && order.status !== "cancelled") {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onAct(order.orderId, "accept")}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Accept / قبول کریں
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAct(order.orderId, "reject")}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject / مسترد کریں
        </button>
      </div>
    );
  }
  const inProgress = ["accepted", "dispatched", "on-the-way", "delivered"].includes(order.status);
  if (order.driverResponse === "accepted" && !order.driverConfirmed && inProgress) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAct(order.orderId, "confirm")}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Confirm delivery / ترسیل کی تصدیق
      </button>
    );
  }
  if (order.driverConfirmed) {
    return <p className="text-xs text-green-700 dark:text-green-400">Confirmed by you / آپ نے تصدیق کی</p>;
  }
  return <span className="text-xs text-slate-400">—</span>;
}

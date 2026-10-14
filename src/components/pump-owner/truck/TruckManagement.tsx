"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { CopyIcon, EyeIcon, EyeOffIcon, PlusIcon, TruckIcon, XIcon } from "@/components/icons";
import { TRUCK_TYPE_LABELS, TRUCK_TYPES, type TruckOrderView, type TruckType, type TruckView } from "@/lib/truck/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const REFRESH_MS = 15000;

interface RouteView {
  distanceKm: number;
  durationMin: number;
  currentRoad: string | null;
  originSource: "live-location" | "pickup-pump";
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function fuelLabel(fuel: "petrol" | "diesel"): string {
  return fuel === "diesel" ? "Diesel / ڈیزل" : "Petrol / پیٹرول";
}

function AvailabilityBadge({ availability }: { availability: "free" | "busy" }) {
  return availability === "busy" ? (
    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Busy / مصروف</span>
  ) : (
    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">Free / خالی</span>
  );
}

// Fetches a truck's route from the server (OSRM). Shows "unavailable" rather than a guess.
function useRoute(truckId: string | null, enabled: boolean) {
  const [route, setRoute] = useState<RouteView | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!truckId || !enabled) return;
    let active = true;
    fetch(`/api/pumpadmin/trucks/${truckId}/route`, { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setRoute(d?.route ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [truckId, enabled]);
  return { route, loaded };
}

// The Create Truck button, the form, the truck cards, Upcoming trucks, and Free and Busy lists.
export function TruckManagement({ initialTrucks, serverNow }: { initialTrucks: TruckView[]; serverNow: number }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The page re-reads the database every 15 seconds, so statuses stay in step with orders.
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const free = useMemo(() => initialTrucks.filter((t) => t.availability === "free"), [initialTrucks]);
  const busy = useMemo(() => initialTrucks.filter((t) => t.availability === "busy"), [initialTrucks]);
  const upcoming = useMemo(() => busy.filter((t) => t.currentTrip !== null), [busy]);

  const nextArrival = upcoming
    .map((t) => t.currentTrip?.expectedArrival ?? "")
    .filter((v) => v !== "")
    .sort()[0];
  const litresIncoming = upcoming.reduce((sum, t) => sum + (t.currentTrip?.quantityLitres ?? 0), 0);
  const delayed = upcoming.filter((t) => t.currentTrip?.expectedArrival && new Date(t.currentTrip.expectedArrival).getTime() < serverNow).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <PlusIcon size={16} />
          Create Truck / ٹرک بنائیں
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Next arrival / اگلی آمد</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{nextArrival ? formatDate(nextArrival) : "None scheduled"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Litres incoming / آنے والا تیل</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{litresIncoming.toLocaleString()} L</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">Delayed / تاخیر</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{delayed}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Your trucks / آپ کے ٹرک" subtitle={`${initialTrucks.length} trucks · ${busy.length} busy · ${free.length} free`} />
        {initialTrucks.length === 0 ? (
          <div className="py-8 text-center">
            <TruckIcon size={28} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No trucks yet / ابھی کوئی ٹرک نہیں</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Create a truck to give a driver a login. / ڈرائیور کو لاگ ان دینے کے لیے ٹرک بنائیں۔</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {initialTrucks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{t.driverName || "—"}</p>
                  <AvailabilityBadge availability={t.availability} />
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  {t.truckNumber || "—"}
                  {t.truckType ? ` · ${TRUCK_TYPE_LABELS[t.truckType].en} / ${TRUCK_TYPE_LABELS[t.truckType].ur}` : ""}
                </p>
                <p className="truncate font-mono text-xs text-slate-500">{t.username || "—"}</p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Pump / پمپ: {t.pumpName || "—"}</p>
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                  Route / راستہ: {t.currentTrip ? `${t.currentTrip.pickupPump} → ${t.currentTrip.destinationPump}` : "—"}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Upcoming trucks / آنے والے ٹرک" subtitle="Trucks on an active trip, with route and location" />
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No active trips. / کوئی فعال سفر نہیں۔</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {upcoming.map((t) => (
              <UpcomingRow key={t.id} truck={t} onOpen={() => setSelectedId(t.id)} />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Free trucks / خالی ٹرک" subtitle={`${free.length}`} />
          {free.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No free trucks. / کوئی خالی ٹرک نہیں۔</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {free.map((t) => (
                <div key={t.id} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-900 dark:text-white">{t.truckNumber}</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.driverName}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Busy trucks / مصروف ٹرک" subtitle={`${busy.length}`} />
          {busy.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No busy trucks. / کوئی مصروف ٹرک نہیں۔</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {busy.map((t) => (
                <div key={t.id} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-900 dark:text-white">{t.truckNumber}</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.driverName}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showCreate && (
        <CreateTruckForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}

      {selectedId && <TruckDetail truckId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function UpcomingRow({ truck, onOpen }: { truck: TruckView; onOpen: () => void }) {
  const { route, loaded } = useRoute(truck.id, true);
  const trip = truck.currentTrip;
  return (
    <button type="button" onClick={onOpen} className="block w-full space-y-1 py-3 text-left text-sm">
      <p className="font-semibold text-slate-900 dark:text-white">
        {truck.truckNumber} · {truck.driverName || "—"}
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        {trip ? fuelLabel(trip.fuelType) : "—"} · {trip ? `${trip.quantityLitres.toLocaleString()} L` : "—"} · Status / حالت: {trip?.orderStatus ?? "—"}
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        Route / راستہ: {trip ? `${trip.pickupPump} → ${trip.destinationPump}` : "—"}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {loaded && route
          ? `${route.distanceKm} km · ${route.durationMin} min · Road / سڑک: ${route.currentRoad ?? "—"} · ${
              route.originSource === "live-location" ? "live location" : "from pickup pump"
            }`
          : loaded
            ? "Route unavailable / راستہ دستیاب نہیں"
            : "Loading route… / راستہ لوڈ ہو رہا ہے"}
      </p>
      <p className="text-xs text-slate-600 dark:text-slate-400">Expected arrival / متوقع وقت: {formatDate(trip?.expectedArrival ?? "")}</p>
    </button>
  );
}

function CreateTruckForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ driverName: "", truckNumber: "", truckType: "" as TruckType | "", password: "" });
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The username is built on the server from the pump name and the truck number, and checked for uniqueness on save.
  useEffect(() => {
    if (form.truckNumber.trim() === "") {
      setUsername("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ truckNumber: form.truckNumber });
        const response = await fetch(`/api/pumpadmin/trucks/username?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.ok && typeof data?.username === "string") setUsername(data.username);
      } catch {
        // The preview is optional.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.truckNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/pumpadmin/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to create the truck");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Truck / ٹرک بنائیں</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Close / بند کریں">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Truck Driver Name / ڈرائیور کا نام</label>
            <VoiceInput value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} placeholder="Driver name / ڈرائیور کا نام" className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Truck Number / ٹرک نمبر</label>
            <VoiceInput value={form.truckNumber} onChange={(e) => setForm({ ...form, truckNumber: e.target.value })} placeholder="e.g. LEB-1234 / ٹرک نمبر" className={inputClass} required />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Truck Type / ٹرک کی قسم</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRUCK_TYPES.map((type) => {
                const selected = form.truckType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setForm({ ...form, truckType: type })}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      selected ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {TRUCK_TYPE_LABELS[type].en} / {TRUCK_TYPE_LABELS[type].ur}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username / یوزر نیم (خودکار)</label>
            <input type="text" readOnly value={username} placeholder="Filled from pump name and truck number / خودکار" className={`${inputClass} bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password / پاس ورڈ</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                aria-label={showPassword ? "Hide password / چھپائیں" : "Show password / دکھائیں"}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
            {saving ? "Saving... / محفوظ ہو رہا ہے" : "Save Truck / محفوظ کریں"}
          </button>
        </form>
      </div>
    </>
  );
}

function TruckDetail({ truckId, onClose }: { truckId: string; onClose: () => void }) {
  const [data, setData] = useState<{ truck: TruckView; orders: TruckOrderView[] } | null>(null);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { route, loaded } = useRoute(truckId, true);

  useEffect(() => {
    let active = true;
    fetch(`/api/pumpadmin/trucks/${truckId}`, { cache: "no-store", credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Failed to load the truck");
        if (active) setData({ truck: d.truck, orders: Array.isArray(d.orders) ? d.orders : [] });
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "An error occurred"));
    return () => {
      active = false;
    };
  }, [truckId]);

  async function resetPassword() {
    setError("");
    const response = await fetch(`/api/pumpadmin/trucks/${truckId}/reset-password`, { method: "POST", credentials: "include", cache: "no-store" });
    const d = await response.json().catch(() => ({}));
    if (!response.ok) return setError(d.error || "Failed to reset the password");
    setNewPassword({ username: d.username, password: d.password });
  }

  const truck = data?.truck;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl space-y-6 overflow-y-auto bg-white p-5 shadow-lg dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{truck ? truck.truckNumber : "Truck / ٹرک"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Close / بند کریں">
            <XIcon size={18} />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {!truck && !error && <p className="text-sm text-slate-600 dark:text-slate-400">Loading… / لوڈ ہو رہا ہے</p>}

        {truck && (
          <>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Driver / ڈرائیور</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{truck.driverName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Truck type / قسم</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{truck.truckType ? `${TRUCK_TYPE_LABELS[truck.truckType].en} / ${TRUCK_TYPE_LABELS[truck.truckType].ur}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Username / یوزر نیم</dt>
                <dd className="font-mono font-medium text-slate-900 dark:text-white">{truck.username || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status / حالت</dt>
                <dd>
                  <AvailabilityBadge availability={truck.availability} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Assigned pump / پمپ</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{truck.pumpName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last location / آخری مقام</dt>
                <dd className="text-slate-900 dark:text-white">
                  {truck.location ? `${truck.location.lat.toFixed(5)}, ${truck.location.lng.toFixed(5)} · ${formatDate(truck.location.at)}` : "Not shared yet / ابھی شیئر نہیں"}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="text-xs text-slate-500">Current route / موجودہ راستہ</p>
              {truck.currentTrip ? (
                <p className="text-slate-900 dark:text-white">
                  {truck.currentTrip.pickupPump} → {truck.currentTrip.destinationPump}
                  {loaded && route ? ` · ${route.distanceKm} km · ${route.durationMin} min · Road / سڑک: ${route.currentRoad ?? "—"}` : loaded ? " · route unavailable" : " · loading…"}
                </p>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No active trip / کوئی فعال سفر نہیں</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="text-xs text-slate-500">Driver password / ڈرائیور کا پاس ورڈ</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Passwords are stored as a secure hash and cannot be shown again. Reset to set a new one.
                / پاس ورڈ محفوظ شکل میں ہے اور دوبارہ نہیں دکھایا جا سکتا۔ نیا بنانے کے لیے ری سیٹ کریں۔
              </p>
              {newPassword && (
                <div className="mt-3 space-y-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                  <p className="text-green-800 dark:text-green-200">
                    New password for <span className="font-mono">{newPassword.username}</span>:{" "}
                    <span className="font-mono font-semibold">{newPassword.password}</span>
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">Copy it now. It will not be shown again. / ابھی کاپی کریں، دوبارہ نہیں دکھایا جائے گا۔</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(newPassword.password).catch(() => undefined);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    <CopyIcon size={14} />
                    {copied ? "Copied / کاپی ہو گیا" : "Copy / کاپی"}
                  </button>
                </div>
              )}
              <button type="button" onClick={resetPassword} className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                Reset password / پاس ورڈ ری سیٹ کریں
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Orders / آرڈر</p>
              {data?.orders.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">No orders yet / ابھی کوئی آرڈر نہیں</p>
              ) : (
                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-800">
                  {data?.orders.map((o) => (
                    <div key={o.orderId} className="space-y-1 p-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {o.orderNumber} · {fuelLabel(o.fuelType)} · {o.quantityLitres.toLocaleString()} L
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Pickup / لوڈنگ: {o.pickupPump || "—"} · Destination / منزل: {o.destinationPump || "—"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Status / حالت: {o.status} · Requested / درخواست: {formatDate(o.requestedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

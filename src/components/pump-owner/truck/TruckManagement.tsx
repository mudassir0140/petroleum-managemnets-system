"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { CheckCircleIcon, ClockIcon, CopyIcon, MapPinIcon, PlusIcon, TruckIcon, XIcon } from "@/components/icons";
import { TRUCK_TYPE_LABELS, TRUCK_TYPES, type TruckOrderView, type TruckType, type TruckView } from "@/lib/truck/types";
import { TruckMapPanel } from "./TruckMapPanel";

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

function AvailabilityBadge({ availability, onTrip = false }: { availability: "free" | "busy"; onTrip?: boolean }) {
  const style =
    availability === "free"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : onTrip
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  const label = availability === "free" ? "Free / خالی" : onTrip ? "On the way / راستے میں" : "Busy / مصروف";
  return <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
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
      {showCreate ? (
        <CreateTruckForm
          onCancel={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <PlusIcon size={16} />
            Create Truck / ٹرک بنائیں
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile icon={<TruckIcon size={20} />} tone="slate" label="Total / کل ٹرک" value={initialTrucks.length} />
        <SummaryTile icon={<CheckCircleIcon size={20} />} tone="green" label="Free / خالی" value={free.length} />
        <SummaryTile icon={<ClockIcon size={20} />} tone="blue" label="Busy / مصروف" value={busy.length} />
        <SummaryTile icon={<MapPinIcon size={20} />} tone="amber" label="On the way / راستے میں" value={upcoming.length} />
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
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <TruckIcon size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{t.truckNumber || "—"}</p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                        {t.truckType ? `${TRUCK_TYPE_LABELS[t.truckType].en} / ${TRUCK_TYPE_LABELS[t.truckType].ur}` : "Type not set / قسم درج نہیں"}
                      </p>
                    </div>
                  </div>
                  <AvailabilityBadge availability={t.availability} onTrip={t.currentTrip !== null} />
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-slate-500">Driver / ڈرائیور</dt>
                    <dd className="truncate font-medium text-slate-900 dark:text-white">{t.driverName || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-slate-500">Pump / پمپ</dt>
                    <dd className="truncate text-slate-700 dark:text-slate-300">{t.pumpName || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-slate-500">Route / راستہ</dt>
                    <dd className="truncate text-slate-700 dark:text-slate-300">{t.currentTrip ? `${t.currentTrip.pickupPump} → ${t.currentTrip.destinationPump}` : "—"}</dd>
                  </div>
                </dl>
                <p className="mt-4 truncate border-t border-slate-100 pt-3 font-mono text-xs text-slate-500 dark:border-slate-800">{t.username || "—"}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Upcoming trucks / آنے والے ٹرک" subtitle="Trucks on an active trip, with route and live location / فعال سفر پر ٹرک" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-2 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"><ClockIcon size={14} /> Next arrival / اگلی آمد</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{nextArrival ? formatDate(nextArrival) : "None scheduled / کوئی نہیں"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"><TruckIcon size={14} /> Litres incoming / آنے والا تیل</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{litresIncoming.toLocaleString()} L</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"><ClockIcon size={14} /> Delayed / تاخیر</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{delayed}</p>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-5 pb-6 pt-4 text-center">
            <MapPinIcon size={28} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No active trips / کوئی فعال سفر نہیں</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Trucks on a trip appear here with their route and map. / سفر پر ٹرک یہاں نقشے کے ساتھ ظاہر ہوں گے۔</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 px-5 dark:divide-slate-700">
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


      {selectedId && <TruckDetail truckId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

const TONE_CLASSES = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
} as const;

// One figure in the summary row: an icon, a label and the count.
function SummaryTile({ icon, tone, label, value }: { icon: React.ReactNode; tone: keyof typeof TONE_CLASSES; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-600 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// An upcoming truck: its trip details on the left, and a small live map preview on the right.
function UpcomingRow({ truck, onOpen }: { truck: TruckView; onOpen: () => void }) {
  const { route, loaded } = useRoute(truck.id, true);
  const trip = truck.currentTrip;
  return (
    <div className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white">
          {truck.truckNumber} · {truck.driverName || "—"}
        </p>
        <p className="text-slate-700 dark:text-slate-300">
          {trip ? fuelLabel(trip.fuelType) : "—"} · {trip ? `${trip.quantityLitres.toLocaleString()} L` : "—"} · Status / حالت: {trip?.orderStatus ?? "—"}
        </p>
        <p className="text-slate-700 dark:text-slate-300">Route / راستہ: {trip ? `${trip.pickupPump} → ${trip.destinationPump}` : "—"}</p>
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
        <button type="button" onClick={onOpen} className="mt-2 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400">
          Open truck details / ٹرک کی تفصیل کھولیں →
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
        <TruckMapPanel src={`/api/pumpadmin/trucks/${truck.id}/map`} compact />
      </div>
    </div>
  );
}

function CreateTruckForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [formData, setFormData] = useState({ driverName: "", phone: "", truckNumber: "", truckType: "" as TruckType | "", password: "" });
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // The username is built on the server from the driver's name and the pump name, the same rule used on save.
  useEffect(() => {
    const driverName = formData.driverName.trim();
    if (!driverName) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ driverName });
        const response = await fetch(`/api/pumpadmin/trucks/username?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.ok && typeof data?.username === "string") setUsername(data.username);
      } catch {
        // The preview is optional; the server sets the real username on save.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.driverName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!formData.truckType) return setError("Choose Long or Short / لمبا یا چھوٹا چنیں");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters / پاس ورڈ کم از کم 6 حروف کا ہو");

    setLoading(true);
    try {
      const response = await fetch("/api/pumpadmin/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to create truck");
      setCreated({ username: String(data.username ?? ""), password: String(data.password ?? "") });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const shownUsername = formData.truckNumber.trim() ? username : "";

  return (
    <Card className="mb-6">
      <CardHeader title="Create Truck / ٹرک بنائیں" subtitle="Create a login for the truck driver / ڈرائیور کا لاگ ان بنائیں" />

      {created ? (
        <div className="space-y-4 p-5 pt-0">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            <p>
              Truck saved. Driver login: <span className="font-mono font-semibold">{created.username}</span>
            </p>
            <p className="mt-1">
              Password: <span className="font-mono font-semibold">{created.password}</span>
            </p>
            <p className="mt-2 text-xs">Give these to the driver now. The password is stored only as a secure hash and cannot be shown again. / یہ ڈرائیور کو ابھی دیں؛ پاس ورڈ دوبارہ نہیں دکھایا جائے گا۔</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(`${created.username} / ${created.password}`).catch(() => undefined);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
            >
              {copied ? "Copied / کاپی ہو گیا" : "Copy login / لاگ ان کاپی کریں"}
            </button>
            <button type="button" onClick={onDone} className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Done / ہو گیا
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-5 pt-0">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-ink-primary">Truck Driver Name / ڈرائیور کا نام</label>
            <VoiceInput
              type="text"
              required
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              placeholder="Enter driver name / ڈرائیور کا نام لکھیں"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary">Truck Number / ٹرک نمبر</label>
            <VoiceInput
              type="text"
              required
              value={formData.truckNumber}
              onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })}
              placeholder="e.g. LEB-1234 / ٹرک نمبر"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-primary">Truck Type / ٹرک کی قسم</label>
            <div className="grid grid-cols-2 gap-2">
              {TRUCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={formData.truckType === type}
                  onClick={() => setFormData({ ...formData, truckType: type })}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    formData.truckType === type ? "bg-brand-500 text-white" : "bg-surface-3 text-ink-primary hover:bg-surface-4"
                  }`}
                >
                  {TRUCK_TYPE_LABELS[type].en} / {TRUCK_TYPE_LABELS[type].ur}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary">Phone / فون</label>
            <VoiceInput
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number / فون نمبر لکھیں"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary">Username / یوزر نیم (خودکار)</label>
            <input
              type="text"
              readOnly
              value={shownUsername}
              placeholder="Built from pump name and truck number / خودکار"
              className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-ink-muted outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-primary">Password / پاس ورڈ</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password / پاس ورڈ لکھیں"
              className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Creating... / بنایا جا رہا ہے" : "Create Truck / ٹرک بنائیں"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
            >
              Cancel / منسوخ
            </button>
          </div>
        </form>
      )}
    </Card>
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
                <dt className="text-xs text-slate-500">Phone / فون</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{truck.phone || "—"}</dd>
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

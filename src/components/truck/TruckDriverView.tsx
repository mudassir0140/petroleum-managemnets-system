"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { LogOutIcon } from "@/components/icons";
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

const LOCATION_INTERVAL_MS = 20000;

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

// The driver's own truck and trip. Location is sent only when the driver allows it.
export function TruckDriverView({ driverName, truckNumber }: { driverName: string; truckNumber: string }) {
  const router = useRouter();
  const [truck, setTruck] = useState<DriverTruck | null>(null);
  const [orders, setOrders] = useState<TruckOrderView[]>([]);
  const [route, setRoute] = useState<RouteView | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [error, setError] = useState("");
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
      if (!response.ok) return;
      const data = await response.json();
      setTruck(data.truck ?? null);
      setOrders(Array.isArray(data.orders) ? data.orders : []);

      const r = await fetch("/api/truck/route", { cache: "no-store", credentials: "include" });
      const rd = r.ok ? await r.json() : null;
      setRoute(rd?.route ?? null);
    } catch {
      setError("Could not load your trip. It will retry.");
    }
  }

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    refresh();
    const timer = setInterval(refresh, 15000);
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
    router.push("/auth/login");
  }

  const trip = truck?.currentTrip ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{driverName || "Driver"}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Truck / ٹرک: {truck?.truckNumber || truckNumber || "—"}
            {truck?.truckType ? ` · ${TRUCK_TYPE_LABELS[truck.truckType].en} / ${TRUCK_TYPE_LABELS[truck.truckType].ur}` : ""}
          </p>
          <p className="mt-1 text-sm">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                truck?.availability === "busy" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {truck?.availability === "busy" ? "Busy / مصروف" : "Free / خالی"}
            </span>
          </p>
        </div>
        <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
          <LogOutIcon size={18} />
          Logout / لاگ آؤٹ
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

      <Card>
        <CardHeader title="Current trip / موجودہ سفر" />
        {!trip ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No active trip. / کوئی فعال سفر نہیں۔</p>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-slate-900 dark:text-white">
              {trip.fuelType === "diesel" ? "Diesel / ڈیزل" : "Petrol / پیٹرول"} · {trip.quantityLitres.toLocaleString()} L
            </p>
            <p className="text-slate-700 dark:text-slate-300">Pickup / لوڈنگ: {trip.pickupPump || "—"}</p>
            <p className="text-slate-700 dark:text-slate-300">Destination / منزل: {trip.destinationPump || "—"}</p>
            <p className="text-slate-700 dark:text-slate-300">Expected arrival / متوقع وقت: {formatDate(trip.expectedArrival)}</p>
            <p className="text-slate-700 dark:text-slate-300">Order status / حالت: {trip.orderStatus}</p>
          </div>
        )}
      </Card>

      {trip && (
        <Card>
          <CardHeader title="Route / راستہ" />
          {route ? (
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
        </Card>
      )}

      <Card>
        <CardHeader title="Location / مقام" />
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {permission === "granted" && "Sharing your location while this page is open. / مقام شیئر ہو رہا ہے۔"}
          {permission === "denied" && "Location permission was denied. Allow it in your browser to share your location. / مقام کی اجازت نہیں دی گئی۔"}
          {!geoSupported && "This browser cannot share location. / یہ براؤزر مقام شیئر نہیں کر سکتا۔"}
          {geoSupported && permission === "unknown" && "Waiting for location permission. / مقام کی اجازت کا انتظار ہے۔"}
        </p>
      </Card>

      <Card>
        <CardHeader title="Your orders / آپ کے آرڈر" />
        {orders.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No orders yet. / ابھی کوئی آرڈر نہیں۔</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {orders.map((o) => (
              <div key={o.orderId} className="py-3 text-sm">
                <p className="font-medium text-slate-900 dark:text-white">
                  {o.orderNumber} · {o.fuelType === "diesel" ? "Diesel" : "Petrol"} · {o.quantityLitres.toLocaleString()} L
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {o.pickupPump} → {o.destinationPump} · {o.status} · {formatDate(o.requestedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

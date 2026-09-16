import { createRng, range } from "@/lib/rng";
import type { FuelPriceState } from "@/lib/types";
import { getStorageService } from "@/lib/storage/localStorage-service";

const BASE_PETROL = 272.5;
const BASE_DIESEL = 279.75;
const DRIFT_INTERVAL_MS = 45_000;
const STORAGE_KEY = "fuel-price";

interface StoreShape extends FuelPriceState {
  lastDriftAt: number;
}

function seedStore(): StoreShape {
  return {
    petrol: BASE_PETROL,
    diesel: BASE_DIESEL,
    petrolPrev: BASE_PETROL,
    dieselPrev: BASE_DIESEL,
    updatedAt: new Date().toISOString(),
    lastDriftAt: Date.now(),
  };
}

function getStore(): StoreShape {
  if (typeof window === "undefined") return seedStore();

  const service = getStorageService();
  const stored = service.read("fuel_price", STORAGE_KEY);

  if (stored) {
    return stored as any;
  }

  const initial = seedStore();
  service.create("fuel_price", { ...initial, id: STORAGE_KEY });
  return initial;
}

function persistStore(store: StoreShape) {
  if (typeof window === "undefined") return;
  const service = getStorageService();
  service.update("fuel_price", STORAGE_KEY, store);
}

function maybeDrift(store: StoreShape) {
  const now = Date.now();
  if (now - store.lastDriftAt < DRIFT_INTERVAL_MS) return;

  store.lastDriftAt = now;
  const shouldChange = Math.random() < 0.6;
  if (!shouldChange) return;

  const petrolStep =
    (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.2 ? 2.5 : 1);
  const dieselStep =
    (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.2 ? 2.5 : 1);

  store.petrolPrev = store.petrol;
  store.dieselPrev = store.diesel;
  store.petrol = Math.max(
    200,
    Math.round((store.petrol + petrolStep) * 100) / 100
  );
  store.diesel = Math.max(
    200,
    Math.round((store.diesel + dieselStep) * 100) / 100
  );
  store.updatedAt = new Date().toISOString();
  persistStore(store);
}

export function getCurrentFuelPrice(): FuelPriceState {
  const store = getStore();
  maybeDrift(store);
  return {
    petrol: store.petrol,
    diesel: store.diesel,
    petrolPrev: store.petrolPrev,
    dieselPrev: store.dieselPrev,
    updatedAt: store.updatedAt,
  };
}

export interface PriceHistoryPoint {
  date: string;
  petrol: number;
  diesel: number;
}

export function getFuelPriceHistory(days: number): PriceHistoryPoint[] {
  const rng = createRng("company-fuel-price-history");
  const points: PriceHistoryPoint[] = [];
  let petrol = BASE_PETROL - range(rng, 4, 10);
  let diesel = BASE_DIESEL - range(rng, 4, 10);

  for (let i = days - 1; i >= 0; i--) {
    petrol = Math.max(200, petrol + range(rng, -2.5, 2.8));
    diesel = Math.max(200, diesel + range(rng, -2.5, 2.8));
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    points.push({
      date: date.toISOString().slice(0, 10),
      petrol: Math.round(petrol * 100) / 100,
      diesel: Math.round(diesel * 100) / 100,
    });
  }

  const current = getCurrentFuelPrice();
  points[points.length - 1] = {
    date: points[points.length - 1].date,
    petrol: current.petrol,
    diesel: current.diesel,
  };
  return points;
}

import type { Driver, Tanker, TankerTrip } from "@/lib/manager/types";

export const DRIVERS: Driver[] = [];

export const TANKERS: Tanker[] = [];

export const TANKER_TRIPS_SEED: TankerTrip[] = [];

export function tankerById(id: string) {
  return TANKERS.find((tanker) => tanker.id === id) ?? null;
}

export function driverById(id: string) {
  return DRIVERS.find((driver) => driver.id === id) ?? null;
}

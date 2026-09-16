import type { Pump } from "@/lib/manager/types";

export const PUMPS: Pump[] = [];

export function pumpById(id: string | null | undefined) {
  return PUMPS.find((pump) => pump.id === id) ?? null;
}

export function pumpStockPercent(pump: Pump) {
  const total = pump.stocks.reduce((sum, s) => sum + s.capacityLiters, 0);
  const current = pump.stocks.reduce((sum, s) => sum + s.stockLiters, 0);
  return total === 0 ? 0 : Math.round((current / total) * 100);
}

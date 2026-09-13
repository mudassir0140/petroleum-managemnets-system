"use client";

import {
  ATTENDANT,
  currentUnitPrice,
  type ClosingReport,
  type PaymentMethod,
  type SaleEntry,
  type ShiftLog,
} from "@/lib/dashboard/data/attendant";
import type { FuelType } from "@/lib/dashboard/data/stations";
import { useSharedState } from "@/lib/store/shared-store";

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.round(Math.random() * 1000)}`;
}

export function useAttendantShift() {
  const [shifts, setShifts] = useSharedState<ShiftLog[]>("attendant-shifts", []);
  const [sales, setSales] = useSharedState<SaleEntry[]>("attendant-sales", []);
  const [reports, setReports] = useSharedState<ClosingReport[]>("attendant-reports", []);

  const activeShift = shifts.find((s) => s.status === "active") ?? null;
  const shiftSales = activeShift ? sales.filter((s) => s.shiftId === activeShift.id) : [];

  function startShift() {
    if (activeShift) return activeShift;
    const shift: ShiftLog = {
      id: newId("SFT"),
      attendantId: ATTENDANT.id,
      pumpId: ATTENDANT.pumpId,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    setShifts((prev) => [shift, ...prev]);
    return shift;
  }

  function recordSale(fuel: FuelType, liters: number, paymentMethod: PaymentMethod) {
    if (!activeShift || liters <= 0) return;
    const unitPrice = currentUnitPrice(fuel);
    const entry: SaleEntry = {
      id: newId("SAL"),
      shiftId: activeShift.id,
      fuel,
      liters,
      unitPrice,
      amount: Math.round(liters * unitPrice),
      paymentMethod,
      recordedAt: new Date().toISOString(),
    };
    setSales((prev) => [entry, ...prev]);
  }

  function endShift(cashCounted: number, notes: string) {
    if (!activeShift) return;
    const cashTotal = shiftSales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((sum, s) => sum + s.amount, 0);
    const cardTotal = shiftSales
      .filter((s) => s.paymentMethod === "card")
      .reduce((sum, s) => sum + s.amount, 0);
    const petrolLiters = shiftSales
      .filter((s) => s.fuel === "petrol")
      .reduce((sum, s) => sum + s.liters, 0);
    const dieselLiters = shiftSales
      .filter((s) => s.fuel === "diesel")
      .reduce((sum, s) => sum + s.liters, 0);

    const report: ClosingReport = {
      id: newId("CLR"),
      shiftId: activeShift.id,
      petrolLiters,
      dieselLiters,
      cashTotal,
      cardTotal,
      revenueTotal: cashTotal + cardTotal,
      cashCounted,
      variance: cashCounted - cashTotal,
      notes,
      submittedAt: new Date().toISOString(),
    };
    setReports((prev) => [report, ...prev]);
    setShifts((prev) =>
      prev.map((s) =>
        s.id === activeShift.id ? { ...s, status: "closed", endedAt: new Date().toISOString() } : s,
      ),
    );
  }

  return { shifts, sales, reports, activeShift, shiftSales, startShift, recordSale, endShift };
}

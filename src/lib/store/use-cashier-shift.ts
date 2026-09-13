"use client";

import {
  CASHIER,
  type CashHandover,
  type CashierShift,
  type CashierTransaction,
  type PaymentMethod,
  type TransactionCategory,
} from "@/lib/dashboard/data/cashier";
import { useSharedState } from "@/lib/store/shared-store";

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.round(Math.random() * 1000)}`;
}

export function useCashierShift() {
  const [shifts, setShifts] = useSharedState<CashierShift[]>("cashier-shifts", []);
  const [transactions, setTransactions] = useSharedState<CashierTransaction[]>(
    "cashier-transactions",
    [],
  );
  const [handovers, setHandovers] = useSharedState<CashHandover[]>("cashier-handovers", []);

  const activeShift = shifts.find((s) => s.status === "active") ?? null;
  const shiftTransactions = activeShift
    ? transactions.filter((t) => t.shiftId === activeShift.id)
    : [];

  function startShift() {
    if (activeShift) return activeShift;
    const shift: CashierShift = {
      id: newId("SFT"),
      cashierId: CASHIER.id,
      pumpId: CASHIER.pumpId,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    setShifts((prev) => [shift, ...prev]);
    return shift;
  }

  function recordTransaction(
    category: TransactionCategory,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
  ) {
    if (!activeShift || amount <= 0) return;
    const entry: CashierTransaction = {
      id: newId("TXN"),
      shiftId: activeShift.id,
      category,
      description: description.trim() || "—",
      amount,
      paymentMethod,
      recordedAt: new Date().toISOString(),
    };
    setTransactions((prev) => [entry, ...prev]);
  }

  function submitHandover(cashCounted: number, handoverTo: string, notes: string) {
    if (!activeShift) return;
    const cashExpected = shiftTransactions
      .filter((t) => t.paymentMethod === "cash")
      .reduce((sum, t) => sum + t.amount, 0);
    const cardTotal = shiftTransactions
      .filter((t) => t.paymentMethod === "card")
      .reduce((sum, t) => sum + t.amount, 0);

    const handover: CashHandover = {
      id: newId("HND"),
      shiftId: activeShift.id,
      cashExpected,
      cashCounted,
      variance: cashCounted - cashExpected,
      cardTotal,
      revenueTotal: cashExpected + cardTotal,
      transactionCount: shiftTransactions.length,
      handoverTo: handoverTo.trim() || "—",
      notes,
      submittedAt: new Date().toISOString(),
    };
    setHandovers((prev) => [handover, ...prev]);
    setShifts((prev) =>
      prev.map((s) =>
        s.id === activeShift.id ? { ...s, status: "closed", endedAt: new Date().toISOString() } : s,
      ),
    );
  }

  return {
    shifts,
    transactions,
    handovers,
    activeShift,
    shiftTransactions,
    startShift,
    recordTransaction,
    submitHandover,
  };
}

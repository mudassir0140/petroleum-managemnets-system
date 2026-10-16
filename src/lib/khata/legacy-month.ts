import type { MonthRow } from "./ledger";

// The month rows in the shape the existing screens already read, plus the monthly status.
export function toLegacyMonth(row: MonthRow, clientId: string, pumpId: string) {
  return {
    _id: row.month,
    khataClientId: clientId,
    pumpId,
    month: row.month,
    openingBalance: row.opening,
    totalFuel: row.fuel,
    paid: row.payments,
    advance: row.advances,
    remaining: row.closing,
    status: row.closed ? "closed" : "open",
    monthStatus: row.status,
    closed: row.closed,
    changedAfterClose: row.changedAfterClose,
    closedSnapshot: row.closedSnapshot,
  };
}


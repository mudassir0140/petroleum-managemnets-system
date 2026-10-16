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
    credit: row.credit,
    // Own unpaid amount of this month (original dues less allocated payments).
    dueRemaining: row.remaining,
    changedAfterClose: row.changedAfterClose,
    closedSnapshot: row.closedSnapshot,
  };
}


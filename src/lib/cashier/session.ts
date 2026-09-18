import { cache } from "react";
import { findCashierById } from "@/lib/cashier/cashier-store";
import { requireDemoRole } from "@/lib/demo/session";
import type { CashierSession } from "@/lib/cashier/types";

// Demo Role Login: picking "Cashier" on /login always signs you in as this
// fixed seeded account (see lib/cashier/cashier-store.ts). DAL shape is
// unchanged — every cashier page/action still resolves cashierId + pumpId
// from HERE, never from client input, so a cashier can only ever act on
// their own pump and their own shifts.
const DEMO_CASHIER_ID = "CSH-014";

export const getCashierSession = cache(async (): Promise<CashierSession> => {
  await requireDemoRole("cashier");

  const account = await findCashierById(DEMO_CASHIER_ID);
  if (!account) {
    throw new Error("Demo Cashier account is missing.");
  }

  return {
    cashierId: account.id,
    cashierName: account.fullName,
    cashierEmail: account.email,
    pumpId: account.pumpId,
    assignedShift: account.assignedShift,
    role: "cashier",
  };
});

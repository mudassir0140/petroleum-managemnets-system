import type { ReactNode } from "react";
import { CashierShell } from "@/components/cashier/CashierShell";
import { getCashierSession } from "@/lib/cashier/session";
import { demoLogoutAction } from "@/lib/demo/actions";
import { getActiveShift } from "@/lib/cashier/shift-store";
import { getPump } from "@/lib/demo-data";

// A per-user, real-time shift dashboard — never served from a static
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function CashierDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCashierSession();
  const pump = getPump(session.pumpId);
  const activeShift = getActiveShift(session.cashierId);

  return (
    <CashierShell session={session} pump={pump} shiftActive={!!activeShift} logoutAction={demoLogoutAction}>
      {children}
    </CashierShell>
  );
}

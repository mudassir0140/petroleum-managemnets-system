import type { ReactNode } from "react";
import { AttendantShell } from "@/components/attendant/AttendantShell";
import { getAttendantSession } from "@/lib/attendant/session";
import { demoLogoutAction } from "@/lib/demo/actions";
import { getActiveShift } from "@/lib/attendant/shift-store";
import { getPump } from "@/lib/demo-data";

// A per-user, real-time shift dashboard — never served from a static
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function AttendantDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAttendantSession();
  const pump = getPump(session.pumpId);
  const activeShift = getActiveShift(session.attendantId);

  return (
    <AttendantShell session={session} pump={pump} shiftActive={!!activeShift} logoutAction={demoLogoutAction}>
      {children}
    </AttendantShell>
  );
}

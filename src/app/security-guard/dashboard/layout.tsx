import type { ReactNode } from "react";
import { SecurityGuardShell } from "@/components/security-guard/SecurityGuardShell";
import { getSecurityGuardSession } from "@/lib/security-guard/session";
import { demoLogoutAction } from "@/lib/demo/actions";
import { getActiveDuty } from "@/lib/security-guard/activity-store";
import { getPump } from "@/lib/demo-data";

// A per-user, real-time duty dashboard — never served from a static
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function SecurityGuardDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSecurityGuardSession();
  const pump = getPump(session.pumpId);
  const activeDuty = getActiveDuty(session.guardId);

  return (
    <SecurityGuardShell session={session} pump={pump} onDuty={!!activeDuty} logoutAction={demoLogoutAction}>
      {children}
    </SecurityGuardShell>
  );
}

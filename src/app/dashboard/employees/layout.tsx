import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/session";
import { getPump } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function EmployeesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const pump = getPump(session.pumpId);

  // Empty notifications array - can be extended with real data later
  const notifications: any[] = [];

  // Mock logout action
  const logoutAction = async () => {
    "use server";
    // This would be implemented with actual logout logic
  };

  return (
    <DashboardShell session={session} pump={pump} notifications={notifications} logoutAction={logoutAction} hideSidebar>
      {children}
    </DashboardShell>
  );
}

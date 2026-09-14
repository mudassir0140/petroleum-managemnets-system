import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin/session";
import { demoLogoutAction } from "@/lib/demo/actions";
import { PUMPS } from "@/lib/demo-data";

// A network-wide, real-time overview — never served from a static
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  return (
    <AdminShell session={session} pumpCount={PUMPS.length} logoutAction={demoLogoutAction}>
      {children}
    </AdminShell>
  );
}

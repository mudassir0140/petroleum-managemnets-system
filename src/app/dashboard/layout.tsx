import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getEmployeeSession } from "@/lib/employee/session";
import { isRoleSlug, type RoleSlug } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Dashboard | PetroManage",
  description:
    "Role-scoped control center for pumps, fuel stock, tanker fleet, payments, employees, finance and reporting.",
};

// Session-derived and role-gated (see proxy.ts for the redirect-away
// enforcement) — never a static build-time shell.
export const dynamic = "force-dynamic";

// The single place that decides which real role is looking at this tree.
// Admin gets full access (same convention as the sidebar's nav filtering);
// every other viewer must have a real employee_session, and that
// session's `role` — not anything client-editable — is what the shell
// renders. proxy.ts has already redirected away anyone whose role isn't
// allowed on the current path, so by the time we get here this is just
// about resolving *which* role to render.
async function resolveDashboardRole(): Promise<RoleSlug | null> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_session")?.value;
  if (adminCookie) {
    try {
      const parsed = JSON.parse(adminCookie);
      if (parsed?.role === "admin") return "admin";
    } catch {
      // fall through to employee session
    }
  }

  const employeeSession = await getEmployeeSession();
  if (employeeSession && isRoleSlug(employeeSession.role)) {
    return employeeSession.role;
  }

  return null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const roleSlug = await resolveDashboardRole();
  if (!roleSlug) redirect("/auth/login");

  return <DashboardShell roleSlug={roleSlug}>{children}</DashboardShell>;
}

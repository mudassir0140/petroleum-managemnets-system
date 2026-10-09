import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmployeeDashboardShell } from "@/components/dashboard/EmployeeDashboardShell";
import { getEmployeeSession } from "@/lib/employee/session";
import { isRoleSlug, type RoleSlug } from "@/lib/roles";

export const dynamic = "force-dynamic";

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

export default async function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const roleSlug = await resolveDashboardRole();
  if (!roleSlug) redirect("/auth/login");

  return (
    <EmployeeDashboardShell roleSlug={roleSlug} pageTitle="Employees & Attendance">
      {children}
    </EmployeeDashboardShell>
  );
}

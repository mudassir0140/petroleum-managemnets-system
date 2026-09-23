import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RoleSlug } from "@/lib/roles";

const EMPLOYEE_COOKIE_NAME = "employee_session";

export interface EmployeeSession {
  employeeId: string;
  email: string;
  name: string;
  role: RoleSlug;
  pumpId?: string;
  attendanceId?: string;
}

// Real (non-demo) employee session, read from the cookie api/auth/employee-login
// sets after a successful login against the MongoDB `employees` collection.
// Every page under this session type re-derives its identity from HERE, not
// from any client-supplied param, same convention as lib/session.ts
// (pump owner) and lib/admin/session.ts (admin).
export const getEmployeeSession = cache(async (): Promise<EmployeeSession | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(EMPLOYEE_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.userId || !parsed.role) return null;
    return {
      employeeId: String(parsed.userId),
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      pumpId: parsed.pumpId ? String(parsed.pumpId) : undefined,
      attendanceId: parsed.attendanceId ? String(parsed.attendanceId) : undefined,
    };
  } catch {
    return null;
  }
});

export async function requireEmployeeSession(): Promise<EmployeeSession> {
  const session = await getEmployeeSession();
  if (!session) redirect("/auth/login");
  return session;
}

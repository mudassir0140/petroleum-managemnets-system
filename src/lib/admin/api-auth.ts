import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { isRoleSlug, type RoleSlug } from "@/lib/roles";

export type ApiActor =
  | { kind: "admin"; id: string }
  | { kind: "employee"; id: string; role: RoleSlug };

// Resolves whoever is calling an /api/admin/* route: either a real Admin
// (admin_session) or a real employee (employee_session) — the same two
// session cookies every other route in this codebase already trusts (see
// lib/admin/session.ts, lib/employee/session.ts). Never a client-supplied
// id — always read from the session cookie set at login.
export async function resolveApiActor(): Promise<ApiActor | null> {
  const cookieStore = await cookies();

  const adminRaw = cookieStore.get("admin_session")?.value;
  if (adminRaw) {
    try {
      const parsed = JSON.parse(adminRaw);
      if (typeof parsed.adminId === "string" && ObjectId.isValid(parsed.adminId)) {
        return { kind: "admin", id: parsed.adminId };
      }
    } catch {
      // fall through to employee session
    }
  }

  const employeeRaw = cookieStore.get("employee_session")?.value;
  if (employeeRaw) {
    try {
      const parsed = JSON.parse(employeeRaw);
      if (typeof parsed.userId === "string" && ObjectId.isValid(parsed.userId) && isRoleSlug(parsed.role)) {
        return { kind: "employee", id: String(parsed.userId), role: parsed.role };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

// True if the actor may call a route restricted to `allowedRoles`. Admin
// always passes — same "full access" convention as the sidebar nav filter
// (dashboard-shell.tsx) and the /dashboard proxy gate (proxy.ts) — an
// employee passes only if their real MongoDB role is in the allowed list.
export function actorHasRole(actor: ApiActor | null, allowedRoles: readonly RoleSlug[]): boolean {
  if (!actor) return false;
  if (actor.kind === "admin") return true;
  return allowedRoles.includes(actor.role);
}

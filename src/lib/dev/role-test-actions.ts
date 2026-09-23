"use server";

// Role Test: a demo/testing-only shortcut that opens any role's real
// dashboard without going through real credentials. It is NOT the normal
// login path (/auth/login) — that one always looks up the caller's exact
// saved role in MongoDB and never asks the visitor to pick one.
//
// Each session cookie set here has the exact same shape the real login
// routes produce (see /api/auth/login, /api/auth/employee-login,
// /admin/login's adminLogin action), so every existing dashboard renders
// through its normal, unmodified code path — this never creates or
// duplicates a dashboard, it just authenticates into the one that already
// exists for the chosen role.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getRoleBySlug, isRoleSlug } from "@/lib/roles";
import { getAllPumps } from "@/lib/db/pump-service";

export interface RoleTestState {
  error?: string;
}

const SESSION_MAX_AGE = 60 * 60 * 2; // 2 hours — short-lived on purpose, this is a test session

export async function roleTestLoginAction(
  _prevState: RoleTestState,
  formData: FormData
): Promise<RoleTestState> {
  const role = formData.get("role");
  if (typeof role !== "string" || !isRoleSlug(role)) {
    return { error: "Choose a role to test." };
  }

  const cookieStore = await cookies();

  // Admin has its own session type/dashboard (/admin), same as a real
  // /admin/login — never routed through employee_session.
  if (role === "admin") {
    cookieStore.set(
      "admin_session",
      JSON.stringify({
        adminId: new ObjectId().toString(),
        adminName: "Role Test — Admin",
        adminEmail: "roletest-admin@petromanage.demo",
        role: "admin",
      }),
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: SESSION_MAX_AGE }
    );
    redirect("/admin");
  }

  // Pump Owner's dashboard (/pump-owner/dashboard) re-reads its pump from
  // MongoDB on every request (see lib/session.ts) — a synthetic pumpId
  // would just bounce back to /pump-owner/login, so this previews against
  // whatever real pump the Admin already created instead of faking one.
  if (role === "pump-owner") {
    const pumps = await getAllPumps();
    const pump = pumps[0];
    if (!pump) {
      return {
        error: "No pump exists yet — create one from the Admin panel first, then Role Test can open its Pump Owner dashboard.",
      };
    }
    cookieStore.set(
      "pump_owner_session",
      JSON.stringify({ pumpId: pump._id!.toString(), email: pump.ownerEmail, role: "pump-owner" }),
      { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: SESSION_MAX_AGE }
    );
    redirect("/pump-owner/dashboard");
  }

  // Every other role: same employee_session shape /api/auth/employee-login
  // sets, scoped to that role's own dashboard (dashboard/layout.tsx resolves
  // the role from this cookie server-side — never from anything client-set).
  const roleMeta = getRoleBySlug(role);
  const userId = new ObjectId().toString();
  cookieStore.set(
    "employee_session",
    JSON.stringify({
      userId,
      email: roleMeta.demoEmail,
      name: `Role Test — ${roleMeta.label}`,
      role,
      pumpId: null,
    }),
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: SESSION_MAX_AGE }
  );

  // Pump attendants always go through the shift flow (/dashboard/attendant/shift*),
  // never the role's configured dashboardHref — same as /api/auth/employee-login.
  // Role Test doesn't create a real attendance record, so always start with the
  // start-reading form.
  if (role === "pump-attendant") {
    redirect("/dashboard/attendant/shift/start");
  }

  redirect(roleMeta.dashboardHref);
}

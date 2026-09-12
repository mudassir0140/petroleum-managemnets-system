import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ROLE_COOKIE_NAME, isDemoRole, type DemoRole } from "@/lib/demo/roles";

// Non-redirecting read of the demo role cookie — used by the root page and
// proxy.ts to decide where to send a visitor without forcing a redirect loop.
export const getDemoRole = cache(async (): Promise<DemoRole | null> => {
  const value = (await cookies()).get(DEMO_ROLE_COOKIE_NAME)?.value;
  return isDemoRole(value) ? value : null;
});

// Authoritative per-portal guard: each role's DAL (lib/session.ts,
// lib/attendant/session.ts, lib/cashier/session.ts, lib/admin/session.ts)
// calls this with its own role so a visitor who picked "cashier" can never
// render the Pump Owner dashboard by navigating there directly, even though
// proxy.ts's optimistic check already tries to bounce them first.
export async function requireDemoRole(expected: DemoRole): Promise<void> {
  const role = await getDemoRole();
  if (role !== expected) {
    redirect("/login");
  }
}

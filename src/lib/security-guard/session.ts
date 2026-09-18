import { cache } from "react";
import { findGuardById } from "@/lib/security-guard/guard-store";
import { requireDemoRole } from "@/lib/demo/session";
import type { SecurityGuardSession } from "@/lib/security-guard/types";

// Demo Role Login: picking "Security Guard" on /login always signs you in
// as this fixed seeded account (see lib/security-guard/guard-store.ts). DAL
// shape is unchanged — every security guard page/action still resolves
// guardId + pumpId from HERE, never from client input, so a guard can only
// ever see and log activity for their own assigned pump.
const DEMO_GUARD_ID = "SEC-014";

export const getSecurityGuardSession = cache(async (): Promise<SecurityGuardSession> => {
  await requireDemoRole("security_guard");

  const account = await findGuardById(DEMO_GUARD_ID);
  if (!account) {
    throw new Error("Demo Security Guard account is missing.");
  }

  return {
    guardId: account.id,
    guardName: account.fullName,
    guardEmail: account.email,
    pumpId: account.pumpId,
    assignedShift: account.assignedShift,
    role: "security_guard",
  };
});

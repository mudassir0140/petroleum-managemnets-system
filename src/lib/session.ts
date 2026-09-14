import { cache } from "react";
import { findAccountById } from "@/lib/auth/user-store";
import { requireDemoRole } from "@/lib/demo/session";
import type { PumpOwnerSession } from "@/lib/types";

// Demo Role Login: picking "Pump Owner" on /login always signs you in as
// this fixed seeded account (see lib/auth/user-store.ts) rather than a real,
// per-visitor login. The Data Access Layer shape is unchanged from before —
// every server component, Server Action and route handler in the Pump Owner
// Dashboard still reads the pump id from HERE, never from a client-supplied
// param — so per-pump data isolation still holds even though the "who is
// this" check is now a role cookie instead of a signed credential.
const DEMO_OWNER_ID = "OWN-014";

export const getSession = cache(async (): Promise<PumpOwnerSession> => {
  await requireDemoRole("pump_owner");

  const account = findAccountById(DEMO_OWNER_ID);
  if (!account) {
    throw new Error("Demo Pump Owner account is missing.");
  }

  return {
    ownerId: account.id,
    ownerName: account.fullName,
    ownerEmail: account.email,
    pumpId: account.pumpId,
    role: "pump_owner",
  };
});

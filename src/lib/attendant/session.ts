import { cache } from "react";
import { findAttendantById } from "@/lib/attendant/attendant-store";
import { requireDemoRole } from "@/lib/demo/session";
import type { AttendantSession } from "@/lib/attendant/types";

// Demo Role Login: picking "Fuel Attendant / Pump Operator" on /login always
// signs you in as this fixed seeded account (see
// lib/attendant/attendant-store.ts). DAL shape is unchanged — every
// attendant page/action still resolves attendantId + pumpId from HERE, never
// from client input, so an attendant can only ever act on their own pump and
// their own shifts.
const DEMO_ATTENDANT_ID = "ATT-014";

export const getAttendantSession = cache(async (): Promise<AttendantSession> => {
  await requireDemoRole("attendant");

  const account = findAttendantById(DEMO_ATTENDANT_ID);
  if (!account) {
    throw new Error("Demo Attendant account is missing.");
  }

  return {
    attendantId: account.id,
    attendantName: account.fullName,
    attendantEmail: account.email,
    pumpId: account.pumpId,
    assignedShift: account.assignedShift,
    role: "attendant",
  };
});

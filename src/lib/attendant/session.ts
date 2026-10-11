import { cache } from "react";
import { cookies } from "next/headers";
import { findAttendantById } from "@/lib/attendant/attendant-store";
import { getDemoRole } from "@/lib/demo/session";
import type { AttendantSession } from "@/lib/attendant/types";

// Demo Role Login: picking "Fuel Attendant / Pump Operator" on /login always
// signs you in as this fixed seeded account (see
// lib/attendant/attendant-store.ts). DAL shape is unchanged — every
// attendant page/action still resolves attendantId + pumpId from HERE, never
// from client input, so an attendant can only ever act on their own pump and
// their own shifts.
const DEMO_ATTENDANT_ID = "ATT-014";
const EMPLOYEE_COOKIE_NAME = "employee_session";

export const getAttendantSession = cache(async (): Promise<AttendantSession> => {

  // Check for real pump attendant (logged in through employee-login)
  const cookieStore = await cookies();
  const employeeSessionRaw = cookieStore.get(EMPLOYEE_COOKIE_NAME)?.value;

  if (employeeSessionRaw) {
    try {
      const parsed = JSON.parse(employeeSessionRaw);

      if (parsed.role === "pump-attendant" && parsed.userId && parsed.pumpId) {
        return {
          attendantId: String(parsed.userId),
          attendantName: parsed.name || "",
          attendantEmail: parsed.email || "",
          pumpId: String(parsed.pumpId),
          assignedShift: "morning",
          role: "pump-attendant",
        };
      }
    } catch (error) {
      console.log("[AttendantSession] Failed to parse employee session");
    }
  }

  // Fall back to demo attendant
  console.log("[AttendantSession] Checking for demo attendant");
  const demoRole = await getDemoRole();

  if (demoRole !== "attendant") {
    console.log("[AttendantSession] Not demo attendant, demo role:", demoRole);
    throw new Error("Unauthorized: not an attendant");
  }

  const account = await findAttendantById(DEMO_ATTENDANT_ID);
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

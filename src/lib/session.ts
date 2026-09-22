import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPumpById } from "@/lib/db/pump-service";
import { registerLivePump } from "@/lib/demo-data";
import type { PumpOwnerSession } from "@/lib/types";

const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";

// The Pump Owner Dashboard reads its pump id from HERE, never from a
// client-supplied param. The session cookie is set by
// /api/pump-owner/login-mongodb after the owner's credentials are checked
// against the pump record the Admin created; the record is re-read from
// MongoDB on every request so a deleted/offline pump loses access at once.
export const getSession = cache(async (): Promise<PumpOwnerSession> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PUMP_OWNER_COOKIE_NAME)?.value;
  if (!raw) redirect("/pump-owner/login");

  let pumpId: string | undefined;
  try {
    pumpId = JSON.parse(raw).pumpId;
  } catch {
    redirect("/pump-owner/login");
  }

  const pump = pumpId ? await getPumpById(pumpId) : null;
  if (!pump || pump.status !== "Online" || pump.accountStatus === "inactive") {
    redirect("/pump-owner/login");
  }

  registerLivePump(pump);

  return {
    ownerId: pump._id!.toString(),
    ownerName: pump.ownerName,
    ownerEmail: pump.ownerEmail,
    pumpId: pump._id!.toString(),
    role: "pump_owner",
  };
});

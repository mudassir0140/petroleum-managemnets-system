import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getPumpById } from "@/lib/db/pump-service";

// The signed-in pump owner for the khata API routes. Unlike the page helper (lib/session.ts), this never
// redirects: a call without a valid session gets a plain 401 from its route.
export async function khataOwner(): Promise<{ pumpId: ObjectId; name: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("pump_owner_session")?.value;
  if (!raw) return null;

  let pumpId: unknown;
  try {
    pumpId = JSON.parse(raw).pumpId;
  } catch {
    return null;
  }
  if (typeof pumpId !== "string" || !ObjectId.isValid(pumpId)) return null;

  const pump = await getPumpById(pumpId);
  if (!pump || pump.status !== "Online" || pump.accountStatus === "inactive") return null;
  return { pumpId: new ObjectId(pumpId), name: pump.ownerName || "pump owner" };
}

import { getTruckAccount } from "@/lib/truck/session";
import { getTruckLive } from "@/lib/truck/map";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The live picture of the signed-in driver's own truck. The truck comes from the session only.
export async function GET() {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const live = await getTruckLive(account._id);
    if (!live) return jsonError(404, "Truck not found");
    return jsonNoStore(live);
  } catch (error) {
    console.error("[TruckLive] GET error:", error);
    return jsonError(500, "Failed to load the live trip");
  }
}

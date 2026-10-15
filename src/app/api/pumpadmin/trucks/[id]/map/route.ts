import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { getTruckLive } from "@/lib/truck/map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The live picture of one truck, for its owner pump and for the pump the truck is delivering to.
// Any other pump gets the same not-found answer as a truck that does not exist.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Truck not found");

    const live = await getTruckLive(new ObjectId(id));
    const pumpText = String(pumpId);
    if (!live || (live.truckPumpId !== pumpText && live.destinationPumpId !== pumpText)) {
      return jsonError(404, "Truck not found");
    }
    return jsonNoStore(live);
  } catch (error) {
    console.error("[TruckMap] GET error:", error);
    return jsonError(500, "Failed to load the map");
  }
}

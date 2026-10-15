import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { getTruckMapData } from "@/lib/truck/map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The live map for one of the owner's trucks: start, destination, driver location and route.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Truck not found");

    const data = await getTruckMapData(pumpId, new ObjectId(id));
    if (!data) return jsonError(404, "Truck not found");
    return jsonNoStore(data);
  } catch (error) {
    console.error("[TruckMap] GET error:", error);
    return jsonError(500, "Failed to load the map");
  }
}

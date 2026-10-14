import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { getTruckForPump } from "@/lib/truck/service";
import { routeForTruck } from "@/lib/truck/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The current route of one of this pump's trucks. Null means no route could be worked out.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Truck not found");
    const truckId = new ObjectId(id);

    if (!(await getTruckForPump(pumpId, truckId))) return jsonError(404, "Truck not found");
    return jsonNoStore({ route: await routeForTruck(truckId) });
  } catch (error) {
    console.error("[Trucks] route error:", error);
    return jsonError(500, "Failed to load the route");
  }
}

import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { getTruckForPump, listOrdersForTruck } from "@/lib/truck/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// One truck's full details and order history. Trucks owned by another pump return 404.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Truck not found");
    const truckId = new ObjectId(id);

    const truck = await getTruckForPump(pumpId, truckId);
    if (!truck) return jsonError(404, "Truck not found");

    return jsonNoStore({ truck, orders: await listOrdersForTruck(pumpId, truckId) });
  } catch (error) {
    console.error("[Trucks] GET detail error:", error);
    return jsonError(500, "Failed to load the truck");
  }
}

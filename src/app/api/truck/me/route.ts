import { getTruckAccount } from "@/lib/truck/session";
import { getTruckForDriver, listOrdersForTruck } from "@/lib/truck/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The driver's own truck, its current trip and its order history.
export async function GET() {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const truck = await getTruckForDriver(account._id);
    if (!truck) return jsonError(404, "Truck not found");

    return jsonNoStore({ truck, orders: await listOrdersForTruck(account.pumpId, account._id) });
  } catch (error) {
    console.error("[TruckMe] GET error:", error);
    return jsonError(500, "Failed to load your truck");
  }
}

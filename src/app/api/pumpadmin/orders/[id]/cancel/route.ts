import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { cancelOrderForPump } from "@/lib/truck/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The pump owner cancels one of its own orders. Its truck becomes Free unless it has another accepted trip.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Order not found");

    const result = await cancelOrderForPump(pumpId, new ObjectId(id));
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[PumpOrders] cancel error:", error);
    return jsonError(500, "Failed to cancel the order");
  }
}

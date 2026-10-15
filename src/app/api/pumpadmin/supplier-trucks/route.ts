import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { listPumpTrucksForRequests } from "@/lib/truck/supplier-requests";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// This pump's trucks for a fuel request, with Free and Busy. The pump id comes from the owner's session.
export async function GET() {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    return jsonNoStore(await listPumpTrucksForRequests(pumpId));
  } catch (error) {
    console.error("[SupplierTrucks] GET error:", error);
    return jsonError(500, "Failed to load trucks");
  }
}

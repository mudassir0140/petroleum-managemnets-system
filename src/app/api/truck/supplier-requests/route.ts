import { getTruckAccount } from "@/lib/truck/session";
import { listRequestsForDriver } from "@/lib/truck/supplier-requests";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The requests waiting for the signed-in driver's own truck. Other trucks' requests are never returned.
export async function GET() {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    return jsonNoStore(await listRequestsForDriver(account._id));
  } catch (error) {
    console.error("[DriverSupplierRequests] GET error:", error);
    return jsonError(500, "Failed to load requests");
  }
}

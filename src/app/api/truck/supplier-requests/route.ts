import { getTruckAccount } from "@/lib/truck/session";
import { listRequestsForDriver } from "@/lib/truck/supplier-requests";
import { attachSupplierNames, listActiveDeliveriesForTruck } from "@/lib/supplier/fuel-deliveries";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The signed-in driver's own truck only: requests waiting for the driver, and deliveries in progress.
export async function GET() {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const [pending, active] = await Promise.all([
      listRequestsForDriver(account._id).then(attachSupplierNames),
      listActiveDeliveriesForTruck(account._id),
    ]);
    return jsonNoStore({ pending, active });
  } catch (error) {
    console.error("[DriverSupplierRequests] GET error:", error);
    return jsonError(500, "Failed to load requests");
  }
}

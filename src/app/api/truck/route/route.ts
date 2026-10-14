import { getTruckAccount } from "@/lib/truck/session";
import { routeForTruck } from "@/lib/truck/route";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The route for the driver's own active trip.
export async function GET() {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    return jsonNoStore({ route: await routeForTruck(account._id) });
  } catch (error) {
    console.error("[TruckRoute] GET error:", error);
    return jsonError(500, "Failed to load the route");
  }
}

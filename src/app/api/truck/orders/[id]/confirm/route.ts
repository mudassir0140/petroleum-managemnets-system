import { ObjectId } from "mongodb";
import { getTruckAccount } from "@/lib/truck/session";
import { confirmTripByDriver } from "@/lib/truck/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The driver confirms delivery from their own truck login.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Trip not found");

    const result = await confirmTripByDriver(account._id, new ObjectId(id));
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[TruckTrip] confirm error:", error);
    return jsonError(500, "Failed to confirm the delivery");
  }
}

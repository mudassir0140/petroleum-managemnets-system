import { NextRequest } from "next/server";
import { getTruckAccount } from "@/lib/truck/session";
import { recordTruckLocation } from "@/lib/truck/service";
import { onTruckLocation } from "@/lib/supplier/fuel-deliveries";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The driver's browser sends its GPS position here, only after the driver grants permission.
// The position is stored for the maps, and then moves the active delivery along (distance and arrival).
export async function POST(request: NextRequest) {
  try {
    const account = await getTruckAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const lat = typeof body?.lat === "number" ? body.lat : NaN;
    const lng = typeof body?.lng === "number" ? body.lng : NaN;
    const accuracy = typeof body?.accuracy === "number" ? body.accuracy : 0;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonError(400, "Invalid location");
    }

    const fix = { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : 0 };
    await recordTruckLocation(account._id, fix);
    await onTruckLocation(account._id, fix, new Date());
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("[TruckLocation] POST error:", error);
    return jsonError(500, "Failed to save the location");
  }
}

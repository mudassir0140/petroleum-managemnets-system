import { NextRequest } from "next/server";
import { getTruckAccount } from "@/lib/truck/session";
import { recordTruckLocation } from "@/lib/truck/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The driver's browser sends its GPS position here, only after the driver grants permission.
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

    await recordTruckLocation(account._id, { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : 0 });
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("[TruckLocation] POST error:", error);
    return jsonError(500, "Failed to save the location");
  }
}

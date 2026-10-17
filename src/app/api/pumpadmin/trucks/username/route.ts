import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { buildTruckUsername } from "@/lib/truck/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Preview of the driver username for the create form: the driver's name and this pump's name.
export async function GET(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const driverName = request.nextUrl.searchParams.get("driverName")?.trim() ?? "";
    if (!driverName) return jsonNoStore({ username: "" });

    const db = await getDatabase();
    const pump = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { name: 1 } });
    return jsonNoStore({ username: await buildTruckUsername(driverName, String(pump?.name ?? "")) });
  } catch (error) {
    console.error("[Trucks] username preview error:", error);
    return jsonError(500, "Failed to build the username");
  }
}

import { NextRequest } from "next/server";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { createTruck, listTrucksForPump } from "@/lib/truck/service";
import { isTruckType } from "@/lib/truck/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner's trucks only: the pump id comes from the owner's session.
export async function GET() {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");
    return jsonNoStore(await listTrucksForPump(pumpId));
  } catch (error) {
    console.error("[Trucks] GET error:", error);
    return jsonError(500, "Failed to load trucks");
  }
}

export async function POST(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const driverName = typeof body?.driverName === "string" ? body.driverName.trim() : "";
    const truckNumber = typeof body?.truckNumber === "string" ? body.truckNumber.trim() : "";
    const truckType = body?.truckType;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!driverName || !truckNumber) return jsonError(400, "Driver name and truck number are required");
    if (!phone) return jsonError(400, "Phone number is required");
    if (!isTruckType(truckType)) return jsonError(400, "Choose Long or Short");
    if (password.length < 6) return jsonError(400, "Password must be at least 6 characters");

    const result = await createTruck(pumpId, { driverName, truckNumber, truckType, phone, password });
    if (!result.ok) return jsonError(result.status, result.error);
    // The plain password is returned once so the owner can hand it to the driver. It is never stored.
    return jsonNoStore({ ...result.data, password }, 201);
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000) return jsonError(409, "That username already exists, try again");
    console.error("[Trucks] POST error:", error);
    return jsonError(500, "Failed to create the truck");
  }
}

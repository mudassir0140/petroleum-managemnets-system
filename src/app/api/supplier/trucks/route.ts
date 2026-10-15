import { NextRequest } from "next/server";
import { getSupplierAccount } from "@/lib/supplier/session";
import { createSupplierTruck, listSupplierTrucks } from "@/lib/supplier/service";
import { isSupplierTruckType } from "@/lib/supplier/types";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The signed-in supplier's own trucks, each marked Free or Busy.
export async function GET() {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    return jsonNoStore(await listSupplierTrucks(account._id));
  } catch (error) {
    console.error("[SupplierTrucks] GET error:", error);
    return jsonError(500, "Failed to load trucks");
  }
}

// Adds a truck to the signed-in supplier: number, type and driver name.
export async function POST(request: NextRequest) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const truckNumber = typeof body?.truckNumber === "string" ? body.truckNumber.trim() : "";
    const driverName = typeof body?.driverName === "string" ? body.driverName.trim() : "";
    if (!truckNumber || truckNumber.length > 20) return jsonError(400, "Enter the truck number");
    if (!isSupplierTruckType(body?.truckType)) return jsonError(400, "Choose the truck type");
    if (!driverName || driverName.length > 80) return jsonError(400, "Enter the driver name");

    const result = await createSupplierTruck(account._id, { truckNumber, truckType: body.truckType, driverName });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data, 201);
  } catch (error) {
    console.error("[SupplierTrucks] POST error:", error);
    return jsonError(500, "Failed to add the truck");
  }
}

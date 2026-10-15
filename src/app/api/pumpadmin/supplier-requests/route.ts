import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { createSupplierRequest } from "@/lib/supplier/service";
import { isSupplierFuelType } from "@/lib/supplier/types";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Numbers from the form. Anything that is not a finite number becomes NaN, which the checks below reject.
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

// The owner sends a fuel request to one of this pump's suppliers, on one of this pump's trucks.
// It is saved as pending-driver and goes to that truck's driver.
export async function POST(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const supplierId = typeof body?.supplierId === "string" ? body.supplierId.trim() : "";
    const truckId = typeof body?.truckId === "string" ? body.truckId.trim() : "";
    const fuelType = body?.fuelType;
    const litres = toNumber(body?.litres);
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const advance = isEmpty(body?.advance) ? 0 : toNumber(body.advance);
    const marketRate = isEmpty(body?.marketRate) ? null : toNumber(body.marketRate);
    const offeredRate = toNumber(body?.offeredRate);

    if (!OBJECT_ID.test(supplierId)) return jsonError(400, "Choose a supplier");
    if (!OBJECT_ID.test(truckId)) return jsonError(400, "Choose a truck");
    if (!isSupplierFuelType(fuelType)) return jsonError(400, "Choose Petrol, Diesel or Octane");
    if (!Number.isFinite(litres) || litres <= 0) return jsonError(400, "Enter the litres");
    if (!Number.isFinite(advance) || advance < 0) return jsonError(400, "Enter a valid advance");
    if (marketRate !== null && (!Number.isFinite(marketRate) || marketRate < 0)) return jsonError(400, "Enter a valid market rate");
    if (!Number.isFinite(offeredRate) || offeredRate <= 0) return jsonError(400, "Enter the offered rate");

    const result = await createSupplierRequest(pumpId, {
      supplierId: new ObjectId(supplierId),
      truckId: new ObjectId(truckId),
      fuelType,
      litres,
      note,
      advance,
      marketRate,
      offeredRate,
    });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data, 201);
  } catch (error) {
    console.error("[SupplierRequests] POST error:", error);
    return jsonError(500, "Failed to send the request");
  }
}

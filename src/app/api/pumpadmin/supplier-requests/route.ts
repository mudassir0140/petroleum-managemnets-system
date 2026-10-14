import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { createSupplierRequest } from "@/lib/supplier/service";
import { isSupplierFuelType } from "@/lib/supplier/types";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner sends a fuel request to one of this pump's suppliers. It is saved as "sent".
export async function POST(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const supplierId = typeof body?.supplierId === "string" ? body.supplierId.trim() : "";
    const fuelType = body?.fuelType;
    const litres = parseFloat(String(body?.litres ?? ""));
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!/^[a-f0-9]{24}$/i.test(supplierId)) return jsonError(400, "Choose a supplier");
    if (!isSupplierFuelType(fuelType)) return jsonError(400, "Choose Petrol, Diesel or Octane");
    if (!Number.isFinite(litres) || litres <= 0) return jsonError(400, "Enter the litres");

    const result = await createSupplierRequest(pumpId, { supplierId: new ObjectId(supplierId), fuelType, litres, note });
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data, 201);
  } catch (error) {
    console.error("[SupplierRequests] POST error:", error);
    return jsonError(500, "Failed to send the request");
  }
}

import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { assignSupplierTruck } from "@/lib/supplier/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Puts one of the supplier's accepted requests On the way with one of the supplier's Free trucks.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!OBJECT_ID.test(id)) return jsonError(404, "Request not found");

    const body = await request.json().catch(() => null);
    const truckId = typeof body?.truckId === "string" ? body.truckId : "";
    if (!OBJECT_ID.test(truckId)) return jsonError(400, "Choose a truck");

    // The service matches the request and the truck on supplierId, so another supplier's ids fail.
    const result = await assignSupplierTruck(account._id, new ObjectId(id), new ObjectId(truckId));
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data);
  } catch (error) {
    console.error("[SupplierRequests] assign error:", error);
    return jsonError(500, "Failed to assign the truck");
  }
}

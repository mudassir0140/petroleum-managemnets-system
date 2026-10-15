import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSupplierAccount } from "@/lib/supplier/session";
import { recordSupplierPayment } from "@/lib/supplier/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Records a payment received against one of the supplier's own requests.
export async function POST(request: NextRequest) {
  try {
    const account = await getSupplierAccount();
    if (!account) return jsonError(401, "Unauthorized");

    const body = await request.json().catch(() => null);
    const requestId = typeof body?.requestId === "string" ? body.requestId : "";
    if (!OBJECT_ID.test(requestId)) return jsonError(404, "Request not found");

    const amount = body?.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return jsonError(400, "Enter an amount greater than 0");
    }

    const result = await recordSupplierPayment(account._id, new ObjectId(requestId), amount);
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore(result.data, 201);
  } catch (error) {
    console.error("[SupplierPayments] POST error:", error);
    return jsonError(500, "Failed to record the payment");
  }
}

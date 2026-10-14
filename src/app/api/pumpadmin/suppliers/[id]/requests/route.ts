import { ObjectId } from "mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { getSupplierForPump, listRequestsForPumpSupplier } from "@/lib/supplier/service";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The owner's live view of one supplier's requests. Only this pump's requests are returned.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");

    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Supplier not found");
    const supplierId = new ObjectId(id);

    const supplier = await getSupplierForPump(pumpId, supplierId);
    if (!supplier) return jsonError(404, "Supplier not found");

    return jsonNoStore(await listRequestsForPumpSupplier(pumpId, supplierId));
  } catch (error) {
    console.error("[Suppliers] requests GET error:", error);
    return jsonError(500, "Failed to load requests");
  }
}

import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { getSupplierAccount, getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { SUPPLIER_REQUESTS } from "@/lib/supplier/service";
import { getTruckAccount } from "@/lib/truck/session";
import { getTruckLive } from "@/lib/truck/map";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The live view of one fuel request, for the supplier, the pump owner, and the request's driver.
// Anyone else gets the same not-found answer as a request that does not exist.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    if (!/^[a-f0-9]{24}$/i.test(id)) return jsonError(404, "Request not found");

    const db = await getDatabase();
    const doc = await db
      .collection(SUPPLIER_REQUESTS)
      .findOne({ _id: new ObjectId(id) }, { projection: { supplierId: 1, pumpId: 1, truckId: 1, status: 1 } });
    if (!doc || !doc.truckId) return jsonError(404, "Request not found");

    const [supplier, pumpId, driver] = await Promise.all([getSupplierAccount(), getOwnerPumpIdForApi(), getTruckAccount()]);
    const allowed =
      (supplier !== null && String(supplier._id) === String(doc.supplierId)) ||
      (pumpId !== null && String(pumpId) === String(doc.pumpId)) ||
      (driver !== null && String(driver._id) === String(doc.truckId));
    if (!allowed) return jsonError(404, "Request not found");

    const live = await getTruckLive(doc.truckId as ObjectId, doc._id as ObjectId);
    if (!live) return jsonError(404, "Request not found");
    return jsonNoStore({ ...live, requestId: String(doc._id), requestStatus: String(doc.status) });
  } catch (error) {
    console.error("[FuelRequestLive] GET error:", error);
    return jsonError(500, "Failed to load the live view");
  }
}

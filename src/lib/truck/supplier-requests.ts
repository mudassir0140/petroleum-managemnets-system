import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { notifyOwnerOfDriverReject, notifySupplierOfRequest } from "@/lib/supplier/notifications";
import { SUPPLIER_REQUESTS, toRequestView, type ServiceResult } from "@/lib/supplier/service";
import { TRUCK_RESERVING_STATUSES, type SupplierRequestView } from "@/lib/supplier/types";
import { listTrucksForPump, syncTruckAvailability } from "@/lib/truck/service";
import type { TruckType } from "@/lib/truck/types";

export interface PumpTruckOption {
  id: string;
  truckNumber: string;
  truckType: TruckType | "";
  driverName: string;
  // true when the truck is on a trip, or another request is holding it. Busy trucks can't be chosen.
  busy: boolean;
}

// The owner's trucks for a supplier request, with Busy when a trip or another request is using them.
export async function listPumpTrucksForRequests(pumpId: ObjectId): Promise<PumpTruckOption[]> {
  const db = await getDatabase();
  const trucks = await listTrucksForPump(pumpId);
  const holds = await db
    .collection(SUPPLIER_REQUESTS)
    .find({ pumpId, status: { $in: [...TRUCK_RESERVING_STATUSES] }, truckId: { $exists: true } }, { projection: { truckId: 1 } })
    .toArray();
  const held = new Set(holds.map((h) => String(h.truckId)));

  return trucks.map((t) => ({
    id: t.id,
    truckNumber: t.truckNumber,
    truckType: t.truckType,
    driverName: t.driverName,
    busy: t.availability === "busy" || held.has(t.id),
  }));
}

// Requests waiting for this truck's driver. Only this truck's requests are returned.
export async function listRequestsForDriver(truckId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db.collection(SUPPLIER_REQUESTS).find({ truckId, status: "pending-driver" }).sort({ sentAt: -1 }).toArray();
  return docs.map(toRequestView);
}

// The driver accepts (the request goes to the supplier and the truck becomes Busy) or rejects
// (the request stops, the truck stays Free, and the pump owner is told).
export async function answerRequestAsDriver(
  truckId: ObjectId,
  requestId: ObjectId,
  action: "accept" | "reject"
): Promise<ServiceResult<{ status: "pending-supplier" | "driver-rejected" }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);

  const existing = await requests.findOne({ _id: requestId, truckId });
  if (!existing) return { ok: false, status: 404, error: "Request not found" };
  if (existing.status !== "pending-driver") return { ok: false, status: 409, error: `This request is already ${existing.status}` };

  const now = new Date();
  const status = action === "accept" ? "pending-supplier" : "driver-rejected";
  const updated = await requests.findOneAndUpdate(
    { _id: requestId, truckId, status: "pending-driver" },
    { $set: { status, driverRespondedAt: now, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, status: 409, error: "This request was already answered" };

  // Busy or Free is recomputed from the trips and requests on this truck.
  await syncTruckAvailability(truckId);

  const details = {
    _id: requestId,
    supplierId: updated.supplierId as ObjectId,
    pumpId: updated.pumpId as ObjectId,
    pumpName: String(updated.pumpName ?? ""),
    fuelType: String(updated.fuelType ?? ""),
    litres: Number(updated.litres) || 0,
  };
  // A failed notification must not fail the driver's answer.
  try {
    if (action === "accept") {
      await notifySupplierOfRequest(details);
    } else {
      await notifyOwnerOfDriverReject({ ...details, truckNumber: String(updated.truckNumber ?? "") });
    }
  } catch (error) {
    console.error("[SupplierNotifications] driver answer notification failed:", error);
  }

  return { ok: true, data: { status } };
}

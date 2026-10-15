import { ObjectId, type Document, type UpdateFilter, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { SUPPLIER_ACCOUNTS, SUPPLIER_REQUESTS, toRequestView, type ServiceResult } from "./service";
import { ACTIVE_REQUEST_STATUSES, checkTransition, confirmationOutcome, type Actor } from "./fuel-workflow";
import { GPS_MAX_ACCURACY_M, GPS_STALE_AFTER_SECONDS, hasArrived, travelStepMeters } from "@/lib/truck/gps";
import { syncTruckAvailability, TRUCKS } from "@/lib/truck/service";
import type { SupplierRequestView } from "./types";
import { formatLocation } from "@/lib/location/fields";

// The fuel delivery workflow for requests sent on a pump truck. Every step is checked against
// fuel-workflow.ts and written with a conditional update, so a repeated click cannot succeed twice.
// Requests, notifications, trucks and pumps are the existing MongoDB collections.
const NOTIFICATIONS = "notifications";

type Fix = { lat: number; lng: number; accuracy: number; at: Date };

function fmt(value: Date | null | undefined): string {
  return value instanceof Date ? value.toLocaleString("en-PK") : "—";
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : "";
}

// A truck position that is accurate and recent enough to use as a real position.
function usableFix(lastLocation: unknown, now: Date): Fix | null {
  const v = (lastLocation ?? null) as Record<string, unknown> | null;
  if (!v || typeof v.lat !== "number" || typeof v.lng !== "number" || !(v.at instanceof Date)) return null;
  const accuracy = typeof v.accuracy === "number" ? v.accuracy : 0;
  if (!(accuracy > 0) || accuracy > GPS_MAX_ACCURACY_M) return null;
  if ((now.getTime() - v.at.getTime()) / 1000 > GPS_STALE_AFTER_SECONDS) return null;
  return { lat: v.lat, lng: v.lng, accuracy, at: v.at };
}

interface Recipient {
  recipientType: "supplier" | "pump-owner";
  recipientId: ObjectId;
}

// One notification per recipient and event. A repeated event matches the existing document.
async function notify(event: string, doc: WithId<Document>, recipients: Recipient[], title: string, message: string, data: Record<string, unknown>) {
  const db = await getDatabase();
  const now = new Date();
  const seen = new Set<string>();
  for (const r of recipients) {
    const dedupeKey = `${event}:${doc._id}:${r.recipientType}:${r.recipientId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    await db.collection(NOTIFICATIONS).updateOne(
      { dedupeKey },
      {
        $setOnInsert: {
          dedupeKey,
          recipientId: r.recipientId,
          recipientType: r.recipientType,
          type: event,
          requestId: doc._id,
          supplierId: doc.supplierId,
          pumpId: doc.pumpId,
          title,
          message,
          data,
          read: false,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }
}

// The names and truck details shown in notifications.
async function detailsOf(doc: Document) {
  const db = await getDatabase();
  const supplier = await db.collection(SUPPLIER_ACCOUNTS).findOne({ _id: doc.supplierId }, { projection: { name: 1, companyName: 1 } });
  const truck = doc.truckId
    ? await db.collection(TRUCKS).findOne({ _id: doc.truckId }, { projection: { registrationNumber: 1, name: 1, driverName: 1, pumpId: 1 } })
    : null;
  const travelledM = typeof doc.travelledM === "number" ? doc.travelledM : null;
  return {
    pumpName: String(doc.pumpName ?? "") || "Pump",
    supplierName: String(supplier?.companyName || supplier?.name || "") || "Supplier",
    fuelType: String(doc.fuelType ?? ""),
    litres: Number(doc.litres) || 0,
    truckNumber: String(doc.truckNumber || truck?.registrationNumber || truck?.name || "") || "—",
    driverName: String(doc.driverName || truck?.driverName || "") || "—",
    truckPumpId: truck?.pumpId instanceof ObjectId ? truck.pumpId : null,
    travelledKm: travelledM === null ? null : Math.round(travelledM / 10) / 100,
  };
}

// The full delivery record for a notification: details, distance, timestamps and confirmation history.
function recordData(doc: Document, d: Awaited<ReturnType<typeof detailsOf>>): Record<string, unknown> {
  return {
    pumpName: d.pumpName,
    supplierName: d.supplierName,
    fuelType: d.fuelType,
    quantityLitres: d.litres,
    truckNumber: d.truckNumber,
    driverName: d.driverName,
    travelledKm: d.travelledKm,
    sentAt: iso(doc.sentAt),
    respondedAt: iso(doc.respondedAt),
    dispatchedAt: iso(doc.dispatchedAt),
    arrivedAt: iso(doc.arrivedAt),
    arrivalSource: String(doc.arrivalSource ?? ""),
    supplierConfirmedAt: iso(doc.supplierConfirmedAt),
    pumpOwnerConfirmedAt: iso(doc.pumpOwnerConfirmedAt),
    completedAt: iso(doc.completedAt),
    confirmations: Array.isArray(doc.confirmations) ? doc.confirmations : [],
  };
}

// The supplier dispatches the truck. The truck's last accurate position becomes the starting point
// for the travelled distance (if it is recent enough).
export async function dispatchRequest(supplierId: ObjectId, requestId: ObjectId): Promise<ServiceResult<{ status: "on-the-way" }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);
  const doc = await requests.findOne({ _id: requestId, supplierId });
  if (!doc) return { ok: false, status: 404, error: "Request not found" };
  const step = checkTransition(String(doc.status), "supplier-dispatch", "supplier");
  if (!step.ok) return { ok: false, status: step.status, error: step.error };
  if (!doc.truckId) return { ok: false, status: 409, error: "This request has no truck yet" };

  const now = new Date();
  const truck = await db.collection(TRUCKS).findOne({ _id: doc.truckId }, { projection: { lastLocation: 1, pumpId: 1 } });
  const fix = truck ? usableFix(truck.lastLocation, now) : null;
  const start = fix ? { lat: fix.lat, lng: fix.lng, at: fix.at } : null;

  const updated = await requests.findOneAndUpdate(
    { _id: requestId, supplierId, status: "accepted" },
    {
      $set: {
        status: "on-the-way",
        dispatchedAt: now,
        dispatchPoint: start,
        lastFix: start,
        travelledM: start ? 0 : null,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, status: 409, error: "This request was already changed" };

  const d = await detailsOf(updated);
  const recipients: Recipient[] = [{ recipientType: "pump-owner", recipientId: updated.pumpId as ObjectId }];
  if (d.truckPumpId) recipients.push({ recipientType: "pump-owner", recipientId: d.truckPumpId });
  try {
    await notify(
      "fuel-dispatched",
      updated,
      recipients,
      "Truck dispatched / ٹرک روانہ ہو گیا",
      `${d.supplierName} dispatched truck ${d.truckNumber} (driver ${d.driverName}) with ${d.litres.toLocaleString()} L ${d.fuelType} for ${d.pumpName}. ${fmt(updated.dispatchedAt)}.`,
      recordData(updated, d)
    );
  } catch (error) {
    console.error("[FuelDelivery] dispatch notification failed:", error);
  }
  return { ok: true, data: { status: "on-the-way" } };
}

// The truck has arrived: from the GPS, or from the driver when GPS is not available.
export async function arriveRequest(requestId: ObjectId, source: "gps" | "driver", truckId?: ObjectId): Promise<ServiceResult<{ status: "arrived" }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);
  const doc = await requests.findOne({ _id: requestId, ...(truckId ? { truckId } : {}) });
  if (!doc) return { ok: false, status: 404, error: "Request not found" };
  const step = checkTransition(String(doc.status), "arrive", source as Actor);
  if (!step.ok) return { ok: false, status: step.status, error: step.error };

  const now = new Date();
  const updated = await requests.findOneAndUpdate(
    { _id: requestId, status: "on-the-way" },
    { $set: { status: "arrived", arrivedAt: now, arrivalSource: source, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return { ok: false, status: 409, error: "This request was already changed" };

  const d = await detailsOf(updated);
  try {
    await notify(
      "fuel-arrived",
      updated,
      [
        { recipientType: "supplier", recipientId: updated.supplierId as ObjectId },
        { recipientType: "pump-owner", recipientId: updated.pumpId as ObjectId },
      ],
      "Truck arrived, please confirm / ٹرک پہنچ گیا، تصدیق کریں",
      `Truck ${d.truckNumber} reached ${d.pumpName} (${source === "gps" ? "GPS arrival" : "reported by driver"}). Supplier and pump owner: please confirm the delivery.`,
      recordData(updated, d)
    );
  } catch (error) {
    console.error("[FuelDelivery] arrival notification failed:", error);
  }
  return { ok: true, data: { status: "arrived" } };
}

// A confirmation by the supplier or the pump owner. The request completes once both have confirmed.
export async function confirmRequest(
  who: "supplier" | "owner",
  requestId: ObjectId,
  scope: { supplierId?: ObjectId; pumpId?: ObjectId }
): Promise<ServiceResult<{ status: string; completed: boolean }>> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);
  const filter = who === "supplier" ? { _id: requestId, supplierId: scope.supplierId } : { _id: requestId, pumpId: scope.pumpId };
  const doc = await requests.findOne(filter);
  if (!doc) return { ok: false, status: 404, error: "Request not found" };

  const step = checkTransition(String(doc.status), who === "supplier" ? "supplier-confirm" : "owner-confirm", who);
  if (!step.ok) return { ok: false, status: step.status, error: step.error };

  const outcome = confirmationOutcome({ supplierConfirmed: !!doc.supplierConfirmedAt, ownerConfirmed: !!doc.pumpOwnerConfirmedAt }, who);
  if (outcome.duplicate) return { ok: false, status: 409, error: "You have already confirmed this delivery / آپ پہلے ہی تصدیق کر چکے ہیں" };

  const now = new Date();
  const field = who === "supplier" ? "supplierConfirmedAt" : "pumpOwnerConfirmedAt";
  const recorded = await requests.updateOne(
    { ...filter, status: "arrived", [field]: { $exists: false } },
    {
      $set: { [field]: now, updatedAt: now },
      $push: { confirmations: { by: who, at: now } },
    } as unknown as UpdateFilter<Document>
  );
  if (recorded.modifiedCount === 0) {
    return { ok: false, status: 409, error: "You have already confirmed this delivery / آپ پہلے ہی تصدیق کر چکے ہیں" };
  }
  if (!outcome.complete) return { ok: true, data: { status: "arrived", completed: false } };

  // Both confirmed. Only one request can move from arrived to completed, so the side effects run once.
  const done = await requests.findOneAndUpdate(
    { _id: requestId, status: "arrived", supplierConfirmedAt: { $exists: true }, pumpOwnerConfirmedAt: { $exists: true } },
    { $set: { status: "completed", completedAt: now, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!done) return { ok: true, data: { status: "arrived", completed: false } };

  // The truck is Free again only if it has no other active request or order.
  if (done.truckId instanceof ObjectId) await syncTruckAvailability(done.truckId);

  const d = await detailsOf(done);
  const recipients: Recipient[] = [
    { recipientType: "supplier", recipientId: done.supplierId as ObjectId },
    { recipientType: "pump-owner", recipientId: done.pumpId as ObjectId },
  ];
  if (d.truckPumpId) recipients.push({ recipientType: "pump-owner", recipientId: d.truckPumpId });
  try {
    await notify(
      "fuel-completed",
      done,
      recipients,
      "Delivery completed / ترسیل مکمل",
      `${d.litres.toLocaleString()} L ${d.fuelType} from ${d.supplierName} to ${d.pumpName} by truck ${d.truckNumber} (driver ${d.driverName}). Travelled ${d.travelledKm ?? "—"} km. Dispatched ${fmt(done.dispatchedAt)}, arrived ${fmt(done.arrivedAt)} (${done.arrivalSource === "gps" ? "GPS" : "driver"}), supplier confirmed ${fmt(done.supplierConfirmedAt)}, pump owner confirmed ${fmt(done.pumpOwnerConfirmedAt)}.`,
      recordData(done, d)
    );
  } catch (error) {
    console.error("[FuelDelivery] completion notification failed:", error);
  }
  return { ok: true, data: { status: "completed", completed: true } };
}

// Called for every GPS position from a truck. While the request is on the way it adds the travelled
// distance and detects arrival at the destination pump.
export async function onTruckLocation(truckId: ObjectId, loc: { lat: number; lng: number; accuracy: number }, now: Date): Promise<void> {
  const db = await getDatabase();
  const requests = db.collection(SUPPLIER_REQUESTS);
  const doc = await requests.findOne({ truckId, status: "on-the-way" }, { sort: { dispatchedAt: -1 } });
  if (!doc) return;

  const accurate = loc.accuracy > 0 && loc.accuracy <= GPS_MAX_ACCURACY_M;
  const previous = doc.lastFix && typeof doc.lastFix.lat === "number" ? { lat: doc.lastFix.lat, lng: doc.lastFix.lng } : null;
  const step = travelStepMeters(previous, loc, loc.accuracy);
  const set: Record<string, unknown> = {};
  if (accurate) set.lastFix = { lat: loc.lat, lng: loc.lng, at: now };
  if (step > 0) set.travelledM = (typeof doc.travelledM === "number" ? doc.travelledM : 0) + step;
  if (Object.keys(set).length > 0) {
    set.updatedAt = now;
    await requests.updateOne({ _id: doc._id, status: "on-the-way" }, { $set: set });
  }

  const pump = await db.collection("pumps").findOne({ _id: doc.pumpId }, { projection: { latitude: 1, longitude: 1 } });
  if (pump && typeof pump.latitude === "number" && typeof pump.longitude === "number") {
    if (hasArrived(loc, { lat: pump.latitude, lng: pump.longitude })) {
      await arriveRequest(doc._id as ObjectId, "gps");
    }
  }
}

// Requests on a truck that are still moving or waiting for confirmation, or recently completed for the pump.
export async function listFuelDeliveriesForPump(pumpId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db
    .collection(SUPPLIER_REQUESTS)
    .find({ pumpId, truckId: { $exists: true }, status: { $in: [...ACTIVE_REQUEST_STATUSES, "completed"] } })
    .sort({ sentAt: -1 })
    .limit(30)
    .toArray();
  return attachSupplierNames(docs.map(toRequestView));
}

// Active deliveries for one driver's truck.
export async function listActiveDeliveriesForTruck(truckId: ObjectId): Promise<SupplierRequestView[]> {
  const db = await getDatabase();
  const docs = await db
    .collection(SUPPLIER_REQUESTS)
    .find({ truckId, status: { $in: [...ACTIVE_REQUEST_STATUSES] } })
    .sort({ sentAt: -1 })
    .toArray();
  return attachSupplierNames(docs.map(toRequestView));
}

// Adds the supplier's name and both saved locations (the supplier's and the pump's) to each request view.
export async function attachSupplierNames(views: SupplierRequestView[]): Promise<SupplierRequestView[]> {
  if (views.length === 0) return views;
  const db = await getDatabase();
  const supplierIds = [...new Set(views.map((v) => v.supplierId))].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const pumpIds = [...new Set(views.map((v) => v.pumpId))].filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const [suppliers, pumps] = await Promise.all([
    db
      .collection(SUPPLIER_ACCOUNTS)
      .find({ _id: { $in: supplierIds } }, { projection: { name: 1, companyName: 1, country: 1, province: 1, district: 1, city: 1 } })
      .toArray(),
    db
      .collection("pumps")
      .find({ _id: { $in: pumpIds } }, { projection: { name: 1, address: 1, city: 1, district: 1, province: 1, country: 1 } })
      .toArray(),
  ]);
  const supplierById = new Map(suppliers.map((s) => [String(s._id), s]));
  const pumpById = new Map(pumps.map((p) => [String(p._id), p]));
  return views.map((v) => {
    const supplier = supplierById.get(v.supplierId);
    const pump = pumpById.get(v.pumpId);
    return {
      ...v,
      supplierName: supplier ? String(supplier.companyName || supplier.name || "") : v.supplierName,
      supplierLocation: supplier ? formatLocation(supplier) : "",
      pumpLocation: pump ? formatLocation(pump) : "",
    };
  });
}

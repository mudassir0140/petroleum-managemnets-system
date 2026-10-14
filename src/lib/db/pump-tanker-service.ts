import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";
import type { FuelOrder, Truck } from "./models";
import { getPumpById } from "./pump-service";
import { syncTruckWithOrder } from "./order-service";
import { hashPassword } from "@/lib/auth/password";

// Pump admin side of the tanker workflow. Trucks registered to a pump live in
// the `trucks` collection, their driver logins in `pump_employees`
// (role "tanker-driver"), and the fuel orders they carry in `orders`.
// Every function takes the pump id from the caller's session, never from client input.

// Carrying capacity by truck type. Admin truck assignment only offers trucks
// whose capacity covers the requested litres, so pump trucks need a value too.
export const TRUCK_CAPACITY_LITRES = { Long: 20000, Short: 10000 } as const;
export type TruckType = keyof typeof TRUCK_CAPACITY_LITRES;

// Orders do not record a pickup pump, so every route starts at the depot.
const PICKUP_LABEL = "Depot";
const OPEN_ORDER_STATUSES: FuelOrder["status"][] = ["pending", "accepted"];
const UPCOMING_ORDER_STATUSES: FuelOrder["status"][] = ["accepted", "dispatched", "on-the-way"];
const CANCELLABLE_ORDER_STATUSES: FuelOrder["status"][] = ["pending", "accepted", "dispatched", "on-the-way"];

export class TankerError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface TankerOrderView {
  id: string;
  fuelType: string;
  quantityLitres: number;
  status: string;
  pickup: string;
  destination: string;
  requestedAt: string;
  expectedArrival: string | null;
  truckId: string | null;
  truckNumber: string | null;
  driverName: string | null;
  notes: string | null;
}

export interface TankerTruckView {
  id: string;
  truckNumber: string;
  driverName: string;
  truckType: string | null;
  username: string | null;
  pumpName: string;
  // free = available, busy = carrying an order, otherwise maintenance/retired.
  state: "free" | "busy" | "maintenance" | "retired";
  route: string | null;
  // Trucks do not report a live position yet, so this is always null for now.
  location: string | null;
  currentOrder: TankerOrderView | null;
}

export interface TankerBoard {
  pumpName: string;
  trucks: TankerTruckView[];
  upcoming: TankerOrderView[];
  newRequests: TankerOrderView[];
}

function toIso(value: Date | string | undefined | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toOrderView(order: FuelOrder & { _id: ObjectId }): TankerOrderView {
  return {
    id: order._id.toString(),
    fuelType: order.fuelType,
    quantityLitres: order.quantityLitres,
    status: order.status,
    pickup: PICKUP_LABEL,
    destination: order.pumpName,
    requestedAt: toIso(order.requestedAt) ?? "",
    expectedArrival: toIso(order.expectedArrival),
    truckId: order.truckId ? order.truckId.toString() : null,
    truckNumber: order.truckName ?? null,
    driverName: order.driverName ?? null,
    notes: order.notes ?? null,
  };
}

function toTruckView(
  truck: Truck & { _id: ObjectId },
  pumpName: string,
  orderById: Map<string, FuelOrder & { _id: ObjectId }>
): TankerTruckView {
  const currentOrder = truck.currentOrderId ? orderById.get(truck.currentOrderId.toString()) : undefined;
  const busy = truck.status === "in-transit";
  const state: TankerTruckView["state"] =
    busy ? "busy" : truck.status === "available" ? "free" : truck.status === "maintenance" ? "maintenance" : "retired";

  return {
    id: truck._id.toString(),
    truckNumber: truck.registrationNumber || truck.name,
    driverName: truck.driverName ?? "",
    truckType: truck.truckType ?? null,
    username: truck.username ?? null,
    pumpName,
    state,
    route: busy && currentOrder ? `${PICKUP_LABEL} → ${currentOrder.pumpName}` : null,
    location: null,
    currentOrder: busy && currentOrder ? toOrderView(currentOrder) : null,
  };
}

// Everything the pump admin Tankers page shows, read fresh from MongoDB.
export async function getPumpTankerBoard(pumpId: string): Promise<TankerBoard> {
  const pump = await getPumpById(pumpId);
  const pumpName = pump?.name ?? "";
  const pumpObjectId = new ObjectId(pumpId);

  const db = await getDatabase();
  const trucks = await db
    .collection<Truck>("trucks")
    .find({ pumpId: pumpObjectId })
    .sort({ createdAt: -1 })
    .toArray();
  const orders = await db
    .collection<FuelOrder>("orders")
    .find({ pumpId: pumpObjectId })
    .sort({ requestedAt: -1 })
    .limit(500)
    .toArray();

  // A pump truck can carry an order for another pump, so fetch those too.
  const carriedIds = trucks.flatMap((t) => (t.currentOrderId ? [t.currentOrderId] : []));
  const carried = carriedIds.length
    ? await db.collection<FuelOrder>("orders").find({ _id: { $in: carriedIds } }).toArray()
    : [];

  const orderById = new Map<string, FuelOrder & { _id: ObjectId }>();
  for (const order of [...orders, ...carried]) {
    if (order._id) orderById.set(order._id.toString(), order as FuelOrder & { _id: ObjectId });
  }

  const upcoming = orders
    .filter((o) => o.truckId && UPCOMING_ORDER_STATUSES.includes(o.status))
    .sort((a, b) => {
      const aTime = a.expectedArrival ? new Date(a.expectedArrival).getTime() : Infinity;
      const bTime = b.expectedArrival ? new Date(b.expectedArrival).getTime() : Infinity;
      return aTime - bTime;
    })
    .map((o) => toOrderView(o as FuelOrder & { _id: ObjectId }));

  const newRequests = orders
    .filter((o) => !o.truckId && OPEN_ORDER_STATUSES.includes(o.status))
    .map((o) => toOrderView(o as FuelOrder & { _id: ObjectId }));

  return {
    pumpName,
    trucks: trucks.map((t) => toTruckView(t as Truck & { _id: ObjectId }, pumpName, orderById)),
    upcoming,
    newRequests,
  };
}

// One truck with its current order and every order it has carried for this pump.
export async function getPumpTruckDetail(pumpId: string, truckId: string) {
  if (!ObjectId.isValid(truckId)) throw new TankerError("Invalid truck ID", 400);
  const pump = await getPumpById(pumpId);
  const pumpName = pump?.name ?? "";
  const pumpObjectId = new ObjectId(pumpId);
  const truckObjectId = new ObjectId(truckId);

  const db = await getDatabase();
  const truck = await db.collection<Truck>("trucks").findOne({ _id: truckObjectId, pumpId: pumpObjectId });
  if (!truck) throw new TankerError("Truck not found", 404);

  const history = await db
    .collection<FuelOrder>("orders")
    .find({ truckId: truckObjectId, pumpId: pumpObjectId })
    .sort({ requestedAt: -1 })
    .toArray();

  const currentOrderDoc = truck.currentOrderId
    ? await db.collection<FuelOrder>("orders").findOne({ _id: truck.currentOrderId })
    : null;
  const orderById = new Map<string, FuelOrder & { _id: ObjectId }>();
  if (currentOrderDoc?._id) orderById.set(currentOrderDoc._id.toString(), currentOrderDoc as FuelOrder & { _id: ObjectId });

  return {
    truck: toTruckView(truck as Truck & { _id: ObjectId }, pumpName, orderById),
    history: history.map((o) => toOrderView(o as FuelOrder & { _id: ObjectId })),
  };
}

function generateDriverUsername(driverName: string, pumpName: string): string {
  const base = driverName.toLowerCase().replace(/\s+/g, "");
  const pumpPart = pumpName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return `${base}.${pumpPart}`.replace(/[^a-z0-9.]/g, "");
}

export interface CreateTruckInput {
  driverName: string;
  truckNumber: string;
  truckType: string;
  password: string;
}

// Registers a truck for the pump and creates the driver's login account.
// Both records are written, and the login is removed again if the truck write fails.
export async function createPumpTruck(pumpId: string, input: CreateTruckInput) {
  const driverName = input.driverName?.trim() ?? "";
  const truckNumber = input.truckNumber?.trim().toUpperCase() ?? "";
  const truckType = input.truckType as TruckType;
  const password = input.password ?? "";

  if (!driverName || !truckNumber || !password) {
    throw new TankerError("Driver name, truck number and password are required", 400);
  }
  if (!(truckType in TRUCK_CAPACITY_LITRES)) {
    throw new TankerError("Truck type must be Long or Short", 400);
  }
  if (password.length < 6) {
    throw new TankerError("Password must be at least 6 characters", 400);
  }

  const pump = await getPumpById(pumpId);
  if (!pump) throw new TankerError("Pump not found", 404);

  const db = await getDatabase();
  const trucks = db.collection<Truck>("trucks");
  const employees = db.collection("pump_employees");

  if (await trucks.findOne({ registrationNumber: truckNumber })) {
    throw new TankerError("A truck with this number already exists", 409);
  }

  // Usernames are looked up across all pumps at login, so uniqueness is global.
  const baseUsername = generateDriverUsername(driverName, pump.name);
  let username = baseUsername;
  for (let counter = 1; await employees.findOne({ username }); counter++) {
    username = `${baseUsername}${counter}`;
  }

  const now = new Date();
  const pumpObjectId = new ObjectId(pumpId);
  const account = await employees.insertOne({
    pumpId: pumpObjectId,
    name: driverName,
    role: "tanker-driver",
    username,
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });

  try {
    const result = await trucks.insertOne({
      name: truckNumber,
      registrationNumber: truckNumber,
      capacityLitres: TRUCK_CAPACITY_LITRES[truckType],
      status: "available",
      pumpId: pumpObjectId,
      truckType,
      driverName,
      username,
      driverAccountId: account.insertedId,
      createdAt: now,
      updatedAt: now,
    });
    return { truckId: result.insertedId.toString(), username };
  } catch (error) {
    await employees.deleteOne({ _id: account.insertedId });
    throw error;
  }
}

// Assigns a free truck of this pump to an open order of this pump. The truck
// and the order are claimed with conditional updates, so a truck can never
// carry two orders even if two requests arrive together.
export async function assignTruckToPumpOrder(
  pumpId: string,
  orderId: string,
  truckId: string,
  expectedArrival: string | null
) {
  if (!ObjectId.isValid(orderId) || !ObjectId.isValid(truckId)) {
    throw new TankerError("Invalid order or truck ID", 400);
  }
  const pumpObjectId = new ObjectId(pumpId);
  const orderObjectId = new ObjectId(orderId);
  const truckObjectId = new ObjectId(truckId);
  const arrival = expectedArrival ? new Date(expectedArrival) : null;
  if (arrival && Number.isNaN(arrival.getTime())) {
    throw new TankerError("Expected arrival is not a valid date", 400);
  }

  const db = await getDatabase();
  const orders = db.collection<FuelOrder>("orders");
  const trucks = db.collection<Truck>("trucks");

  const order = await orders.findOne({ _id: orderObjectId, pumpId: pumpObjectId });
  if (!order) throw new TankerError("Order not found", 404);
  if (order.truckId || !OPEN_ORDER_STATUSES.includes(order.status)) {
    throw new TankerError("This order already has a truck or is no longer open", 409);
  }

  const claimedTruck = await trucks.findOneAndUpdate(
    { _id: truckObjectId, pumpId: pumpObjectId, status: "available" },
    {
      $set: {
        status: "in-transit",
        currentOrderId: orderObjectId,
        currentPumpId: pumpObjectId,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  if (!claimedTruck) throw new TankerError("Truck is not free for this pump", 409);

  const now = new Date();
  const claimedOrder = await orders.findOneAndUpdate(
    {
      _id: orderObjectId,
      pumpId: pumpObjectId,
      truckId: { $exists: false },
      status: { $in: OPEN_ORDER_STATUSES },
    },
    {
      $set: {
        truckId: truckObjectId,
        truckName: claimedTruck.registrationNumber || claimedTruck.name,
        driverId: claimedTruck.driverAccountId,
        driverName: claimedTruck.driverName,
        status: "dispatched",
        dispatchedAt: now,
        ...(arrival ? { expectedArrival: arrival } : {}),
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  if (!claimedOrder) {
    // The order changed under us, so give the truck back.
    await trucks.updateOne(
      { _id: truckObjectId, currentOrderId: orderObjectId },
      {
        $set: { status: "available", updatedAt: now },
        $unset: { currentOrderId: "", currentPumpId: "" },
      }
    );
    throw new TankerError("This order already has a truck or is no longer open", 409);
  }

  return { orderId, truckId };
}

// Accepts a pending order of this pump.
export async function acceptPumpOrder(pumpId: string, orderId: string) {
  if (!ObjectId.isValid(orderId)) throw new TankerError("Invalid order ID", 400);
  const now = new Date();
  const db = await getDatabase();
  const result = await db.collection<FuelOrder>("orders").updateOne(
    { _id: new ObjectId(orderId), pumpId: new ObjectId(pumpId), status: "pending" },
    { $set: { status: "accepted", acceptedAt: now, updatedAt: now } }
  );
  if (result.matchedCount === 0) throw new TankerError("Only pending orders can be accepted", 409);
  return { orderId };
}

// Cancels an open order of this pump and frees the truck it was carrying.
export async function cancelPumpOrder(pumpId: string, orderId: string) {
  if (!ObjectId.isValid(orderId)) throw new TankerError("Invalid order ID", 400);
  const db = await getDatabase();
  const cancelled = await db.collection<FuelOrder>("orders").findOneAndUpdate(
    {
      _id: new ObjectId(orderId),
      pumpId: new ObjectId(pumpId),
      status: { $in: CANCELLABLE_ORDER_STATUSES },
    },
    { $set: { status: "cancelled", updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!cancelled) throw new TankerError("This order can no longer be cancelled", 409);
  await syncTruckWithOrder(cancelled);
  return { orderId };
}

// Shared supplier types and labels. No server-only imports, so pages and API routes can both use them.

export const SUPPLIER_FUEL_TYPES = ["petrol", "diesel", "octane"] as const;
export type SupplierFuelType = (typeof SUPPLIER_FUEL_TYPES)[number];

// English and Urdu labels, shown together in the UI.
export const SUPPLIER_FUEL_LABELS: Record<SupplierFuelType, { en: string; ur: string }> = {
  petrol: { en: "Petrol", ur: "پیٹرول" },
  diesel: { en: "Diesel", ur: "ڈیزل" },
  octane: { en: "Octane", ur: "آکٹین" },
};

export function isSupplierFuelType(value: unknown): value is SupplierFuelType {
  return typeof value === "string" && (SUPPLIER_FUEL_TYPES as readonly string[]).includes(value);
}

export const SUPPLIER_REQUEST_STATUSES = ["sent", "seen", "accepted", "rejected", "on-the-way", "delivered"] as const;
export type SupplierRequestStatus = (typeof SUPPLIER_REQUEST_STATUSES)[number];

export const SUPPLIER_STATUS_LABELS: Record<SupplierRequestStatus, { en: string; ur: string }> = {
  sent: { en: "Sent", ur: "بھیجا گیا" },
  seen: { en: "Seen", ur: "دیکھا گیا" },
  accepted: { en: "Accepted", ur: "قبول" },
  rejected: { en: "Rejected", ur: "مسترد" },
  "on-the-way": { en: "On the way", ur: "راستے میں" },
  delivered: { en: "Delivered", ur: "پہنچا دیا گیا" },
};

// What the supplier can do to a request from the request card, and which statuses each action may start from.
// Truck assignment has its own endpoint because it needs a truck id.
export type SupplierAction = "seen" | "accept" | "reject" | "deliver";

export const SUPPLIER_ACTION_RULES: Record<SupplierAction, { from: SupplierRequestStatus[]; to: SupplierRequestStatus }> = {
  seen: { from: ["sent"], to: "seen" },
  accept: { from: ["sent", "seen"], to: "accepted" },
  reject: { from: ["sent", "seen"], to: "rejected" },
  deliver: { from: ["on-the-way"], to: "delivered" },
};

// Assigning a truck moves an accepted request to On the way.
export const SUPPLIER_ASSIGN_RULE: { from: SupplierRequestStatus[]; to: SupplierRequestStatus } = {
  from: ["accepted"],
  to: "on-the-way",
};

export function isSupplierAction(value: unknown): value is SupplierAction {
  return value === "seen" || value === "accept" || value === "reject" || value === "deliver";
}

export const SUPPLIER_TRUCK_TYPES = ["long", "short"] as const;
export type SupplierTruckType = (typeof SUPPLIER_TRUCK_TYPES)[number];

export const SUPPLIER_TRUCK_TYPE_LABELS: Record<SupplierTruckType, { en: string; ur: string }> = {
  long: { en: "Long", ur: "لمبا" },
  short: { en: "Short", ur: "چھوٹا" },
};

export function isSupplierTruckType(value: unknown): value is SupplierTruckType {
  return typeof value === "string" && (SUPPLIER_TRUCK_TYPES as readonly string[]).includes(value);
}

export interface SupplierView {
  id: string;
  name: string;
  companyName: string;
  username: string;
  advance: number;
  pumpId: string;
  createdAt: string;
}

export interface SupplierRequestView {
  id: string;
  supplierId: string;
  pumpId: string;
  pumpName: string;
  fuelType: SupplierFuelType;
  litres: number;
  note: string;
  status: SupplierRequestStatus;
  sentAt: string;
  seenAt: string;
  respondedAt: string;
  deliveredAt: string;
  // Set when the supplier accepts: the rate per litre they entered, and litres × rate.
  ratePerLitre: number | null;
  amount: number | null;
  // Sum of the payments the supplier recorded against this request.
  paid: number;
  // amount minus paid, or null while no amount is set.
  remaining: number | null;
  // Set when a truck is assigned (On the way).
  truckId: string;
  truckNumber: string;
  driverName: string;
  assignedAt: string;
}

export interface SupplierTruckView {
  id: string;
  truckNumber: string;
  truckType: SupplierTruckType | "";
  driverName: string;
  // true while an On the way request is using this truck.
  busy: boolean;
  currentRequestId: string;
}

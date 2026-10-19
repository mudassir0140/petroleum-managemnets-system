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

export const SUPPLIER_REQUEST_STATUSES = [
  "pending-driver",
  "driver-rejected",
  "pending-supplier",
  "supplier-rejected",
  "sent",
  "seen",
  "accepted",
  "rejected",
  "on-the-way",
  "arrived",
  "completed",
  "delivered",
] as const;
export type SupplierRequestStatus = (typeof SUPPLIER_REQUEST_STATUSES)[number];

export const SUPPLIER_STATUS_LABELS: Record<SupplierRequestStatus, { en: string; ur: string }> = {
  sent: { en: "Sent", ur: "بھیجا گیا" },
  seen: { en: "Seen", ur: "دیکھا گیا" },
  accepted: { en: "Processing", ur: "پروسیسنگ" },
  rejected: { en: "Rejected", ur: "مسترد" },
  "on-the-way": { en: "On the way", ur: "راستے میں" },
  delivered: { en: "Delivered", ur: "پہنچا دیا گیا" },
  "pending-driver": { en: "Requested, waiting for driver", ur: "درخواست، ڈرائیور کا انتظار" },
  "driver-rejected": { en: "Driver rejected", ur: "ڈرائیور نے مسترد کیا" },
  "pending-supplier": { en: "Requested, waiting for supplier", ur: "درخواست، سپلائر کا انتظار" },
  "supplier-rejected": { en: "Supplier rejected", ur: "سپلائر نے مسترد کیا" },
  arrived: { en: "Arrived / Confirmation Pending", ur: "پہنچ گیا / تصدیق باقی" },
  completed: { en: "Completed", ur: "مکمل" },
};

// What the supplier can do to a request from the request card, and which statuses each action may start from.
// Truck assignment has its own endpoint because it needs a truck id.
export type SupplierAction = "seen" | "accept" | "reject" | "deliver" | "dispatch" | "confirm";

export const SUPPLIER_ACTION_RULES: Record<SupplierAction, { from: SupplierRequestStatus[]; to: SupplierRequestStatus }> = {
  seen: { from: ["sent"], to: "seen" },
  accept: { from: ["sent", "seen", "pending-supplier"], to: "accepted" },
  reject: { from: ["sent", "seen", "pending-supplier"], to: "rejected" },
  deliver: { from: ["on-the-way"], to: "delivered" },
  // Dispatch and confirm are handled by fuel-deliveries.ts; these rules keep the record complete.
  dispatch: { from: ["accepted"], to: "on-the-way" },
  confirm: { from: ["arrived"], to: "arrived" },
};

// Assigning a truck moves an accepted request to On the way.
export const SUPPLIER_ASSIGN_RULE: { from: SupplierRequestStatus[]; to: SupplierRequestStatus } = {
  from: ["accepted"],
  to: "on-the-way",
};

// What a supplier sees: only requests the truck's driver has accepted.
export const SUPPLIER_VISIBLE_STATUSES = ["pending-supplier", "supplier-rejected", "accepted", "on-the-way", "arrived", "completed", "delivered"] as const;

// Requests that keep a pump truck reserved: the driver is deciding, or the supplier has not answered yet, or it was accepted.
export const TRUCK_RESERVING_STATUSES = ["pending-driver", "pending-supplier", "accepted", "on-the-way", "arrived"] as const;

export function isSupplierAction(value: unknown): value is SupplierAction {
  return value === "seen" || value === "accept" || value === "reject" || value === "deliver" || value === "dispatch" || value === "confirm";
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
  disabled?: boolean;
  advance: number;
  pumpId: string;
  createdAt: string;
  // Saved location. Empty for suppliers created before locations were required.
  country: string;
  province: string;
  district: string;
  city: string;
  locationText: string;
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
  // Set on requests sent with one of the pump's trucks: the market and offered rate per litre, and the request's advance.
  marketRate: number | null;
  offeredRate: number | null;
  requestAdvance: number | null;
  // Workflow record: the supplier's name, and the timestamps and confirmations of the delivery.
  supplierName: string;
  dispatchedAt: string;
  arrivedAt: string;
  arrivalSource: string;
  supplierConfirmedAt: string;
  pumpOwnerConfirmedAt: string;
  completedAt: string;
  // Distance the truck has covered on the way, from GPS, in kilometres. null when not measured.
  travelledKm: number | null;
  // Saved locations of the supplier (pickup) and the pump (delivery), as one line each.
  supplierLocation: string;
  pumpLocation: string;
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

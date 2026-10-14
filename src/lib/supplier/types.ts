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

export const SUPPLIER_REQUEST_STATUSES = ["sent", "seen", "accepted", "rejected", "delivered"] as const;
export type SupplierRequestStatus = (typeof SUPPLIER_REQUEST_STATUSES)[number];

export const SUPPLIER_STATUS_LABELS: Record<SupplierRequestStatus, { en: string; ur: string }> = {
  sent: { en: "Sent", ur: "بھیجا گیا" },
  seen: { en: "Seen", ur: "دیکھا گیا" },
  accepted: { en: "Accepted", ur: "قبول" },
  rejected: { en: "Rejected", ur: "مسترد" },
  delivered: { en: "Delivered", ur: "پہنچا دیا گیا" },
};

// What the supplier can do to a request, and which statuses each action may start from.
export type SupplierAction = "seen" | "accept" | "reject" | "deliver";

export const SUPPLIER_ACTION_RULES: Record<SupplierAction, { from: SupplierRequestStatus[]; to: SupplierRequestStatus }> = {
  seen: { from: ["sent"], to: "seen" },
  accept: { from: ["sent", "seen"], to: "accepted" },
  reject: { from: ["sent", "seen"], to: "rejected" },
  deliver: { from: ["accepted"], to: "delivered" },
};

export function isSupplierAction(value: unknown): value is SupplierAction {
  return value === "seen" || value === "accept" || value === "reject" || value === "deliver";
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
}

// Shared supplier types and labels. No server-only imports here, so the
// API routes and the client components can both use them.

export const SUPPLIER_FUEL_TYPES = ["petrol", "diesel", "hi-octane"] as const;
export type SupplierFuelType = (typeof SUPPLIER_FUEL_TYPES)[number];

export const SUPPLIER_FUEL_LABELS: Record<SupplierFuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  "hi-octane": "Hi-Octane",
};

export function isSupplierFuelType(value: unknown): value is SupplierFuelType {
  return typeof value === "string" && (SUPPLIER_FUEL_TYPES as readonly string[]).includes(value);
}

export type SupplierRequestStatus = "pending" | "accepted" | "rejected" | "delivered";

export const SUPPLIER_REQUEST_LABELS: Record<SupplierRequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  delivered: "Delivered",
};

export interface SupplierSummary {
  requestedLitres: number;
  deliveredLitres: number;
  deliveredAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  pendingRequests: number;
}

export interface SupplierProfile {
  _id: string;
  ownerName: string;
  companyName: string;
  username: string;
  fuelType: SupplierFuelType;
  location: string;
  contact: string;
  pumpId: string;
  createdAt: string;
}

export interface SupplierListItem extends SupplierProfile {
  summary: SupplierSummary;
}

export interface SupplierRequest {
  _id: string;
  supplierId: string;
  pumpName: string;
  fuelType: SupplierFuelType;
  litres: number;
  advanceAmount: number;
  deliveredLitres: number;
  note: string;
  status: SupplierRequestStatus;
  requestedAt: string;
  respondedAt?: string;
}

export interface SupplierDelivery {
  _id: string;
  requestId: string;
  fuelType: SupplierFuelType;
  litres: number;
  ratePerLitre: number;
  amount: number;
  deliveredAt: string;
  note: string;
}

export interface SupplierPayment {
  _id: string;
  amount: number;
  paidAt: string;
  note: string;
}

export interface SupplierNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  pumpName: string;
  fuelType: SupplierFuelType;
  litres: number;
  requestDate: string;
  createdAt: string;
  readAt?: string;
}

export const EMPTY_SUPPLIER_SUMMARY: SupplierSummary = {
  requestedLitres: 0,
  deliveredLitres: 0,
  deliveredAmount: 0,
  receivedAmount: 0,
  pendingAmount: 0,
  pendingRequests: 0,
};

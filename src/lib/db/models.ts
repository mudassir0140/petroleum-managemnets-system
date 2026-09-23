import type { ObjectId } from "mongodb";
import type { RoleSlug } from "@/lib/roles";

// MongoDB Models (new system - single source of truth)
export interface Admin {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface PumpRecord {
  _id?: ObjectId;
  name: string;
  companyName?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPasswordHash?: string;
  role?: "pump-owner";
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status: "Online" | "Offline" | "Maintenance";
  // Distinct from operational `status`: an Admin can disable a pump owner's
  // login (e.g. contract ended) without changing the pump's Online/Offline
  // operational state.
  accountStatus?: "active" | "inactive";
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface EmployeeRecord {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  // Any assignable role from src/lib/roles.ts (ROLES), excluding "admin" and
  // "pump-owner" — see getAssignableEmployeeRoles().
  role: RoleSlug;
  department?: string;
  pumpId?: ObjectId;
  status: "active" | "inactive";
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  lastLogin?: Date;
}

// One document per (pump, date, shift) — the Pump Owner logs each shift's
// totals once and can edit them the same day; sales-service.ts upserts on
// that triple instead of appending duplicate rows per shift.
export interface SaleRecord {
  _id?: ObjectId;
  pumpId: ObjectId;
  date: string; // ISO date, e.g. "2026-09-22"
  shift: "morning" | "evening" | "night";
  petrolLitres: number;
  dieselLitres: number;
  cashRevenue: number;
  cardRevenue: number;
  revenue: number; // cashRevenue + cardRevenue
  recordedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// One document per (employee, date) — attendance is auto-marked on login,
// so `loginAt` is set once on the first login that day (upsert is a no-op
// if a record already exists for today) and `logoutAt` is set separately
// by the logout/end-of-shift action.
export interface AttendanceLog {
  _id?: ObjectId;
  employeeId: ObjectId;
  pumpId?: ObjectId;
  date: string; // "YYYY-MM-DD"
  loginAt: Date;
  logoutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Start/end-of-duty meter reading + photo for a pump attendant's shift.
// Two documents per attendance record (type "start" and "end"); the litres
// dispensed for that shift is end.reading - start.reading, computed by the
// caller rather than stored, so it's always derived from the source values.
export interface MeterReading {
  _id?: ObjectId;
  employeeId: ObjectId;
  pumpId: ObjectId;
  attendanceId: ObjectId;
  date: string; // "YYYY-MM-DD"
  type: "start" | "end";
  fuelType: "petrol" | "diesel";
  reading: number;
  photoDataUrl: string; // base64 data: URI, resized client-side before upload
  recordedAt: Date;
}

// A pump requesting a fuel resupply from the company. Admin (or, later,
// the pump owner) creates it as "pending"; Admin moves it through
// "dispatched" to "delivered" as the physical delivery progresses.
export interface FuelOrder {
  _id?: ObjectId;
  pumpId: ObjectId;
  pumpName: string; // denormalized so the admin list doesn't need a join
  fuelType: "petrol" | "diesel";
  quantityLitres: number;
  status: "pending" | "dispatched" | "delivered";
  notes?: string;
  requestedBy: ObjectId; // admin who logged the order
  requestedAt: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// What a pump owes the company for fuel supplied, and whether it's been
// settled. `status` is stored (not just derived) so Admin can explicitly
// mark something paid; "overdue" is whatever the admin UI computes at
// read time (status === "pending" && dueDate < now), not a stored value,
// to avoid it going stale.
export interface PumpPayment {
  _id?: ObjectId;
  pumpId: ObjectId;
  pumpName: string;
  orderId?: ObjectId;
  amountDue: number;
  amountPaid: number;
  status: "paid" | "pending";
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  userId: string;
  email: string;
  role: "admin" | "employee" | "pump-manager" | "security-guard";
  pumpId?: string;
  status: "active" | "inactive";
}

// Legacy file-based storage models (deprecated)
export interface Pump {
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerEmail: string;
  password?: string;
  ownerPhone: string;
  address: string;
  city: string;
  status: "open" | "low-stock" | "closed" | "disabled";
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  email: string;
  passwordHash: string;
  role: "pump-owner" | "employee" | "admin" | "pump-owner-manager";
  pumpId?: string;
  employeeId?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface ManagerProfile {
  managerId: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  pumpId: string;
  pumpName: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  requestId: string;
  userEmail: string;
  requestType: "pump-owner" | "employee";
  role?: string;
  pumpId?: string;
  employeeId?: string;
  pumpName?: string;
  pumpOwnerName?: string;
  employeeName?: string;
  employeePhone?: string;
  city?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

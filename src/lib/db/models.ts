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

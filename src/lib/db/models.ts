import type { ObjectId } from "mongodb";

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
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status: "Online" | "Offline" | "Maintenance";
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
  role: "employee" | "pump-manager" | "security-guard";
  department?: string;
  pumpId?: ObjectId;
  status: "active" | "inactive";
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  lastLogin?: Date;
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

import { ObjectId } from "mongodb";

export interface Pump {
  _id?: ObjectId;
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  status: "open" | "low-stock" | "closed" | "disabled";
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  _id?: ObjectId;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: string; // Role slug from ROLES
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  role: "pump-owner" | "employee" | "admin";
  pumpId?: string; // For pump owners
  employeeId?: string; // For employees
  approvalStatus: "pending" | "approved" | "rejected";
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface ApprovalRequest {
  _id?: ObjectId;
  requestId: string;
  userEmail: string;
  requestType: "pump-owner" | "employee"; // Type of signup request
  role?: string; // For employees
  pumpId?: string;
  employeeId?: string;
  pumpName?: string;
  pumpOwnerName?: string;
  employeeName?: string;
  employeePhone?: string;
  city?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

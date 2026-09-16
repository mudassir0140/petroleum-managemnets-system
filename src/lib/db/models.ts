// File-based storage models (no MongoDB ObjectId)

export interface Pump {
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

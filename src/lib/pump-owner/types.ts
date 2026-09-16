export interface PumpOwnerAccount {
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
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: string;
}

export interface PumpOwnerSignupRequest {
  id: string;
  email: string;
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface PumpOwnerSession {
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
}

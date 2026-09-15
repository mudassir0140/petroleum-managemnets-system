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
}

export interface PumpOwnerSession {
  pumpId: string;
  pumpName: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
}

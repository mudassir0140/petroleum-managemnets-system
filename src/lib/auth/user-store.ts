import { getStorageService } from "@/lib/storage/localStorage-service";

export interface PumpOwnerAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  pumpId: string;
  pumpName: string;
  pumpLocation: string;
  passwordHash: string;
  createdAt: string;
}

export function findAccountById(id: string): PumpOwnerAccount | null {
  if (typeof window === "undefined") return null;
  const service = getStorageService();
  const data = service.read("pump_owner_accounts", id);
  return data ? (data as any) : null;
}

export function findAccountByPumpId(pumpId: string): PumpOwnerAccount | null {
  if (typeof window === "undefined") return null;
  const service = getStorageService();
  const data = service.findOne(
    "pump_owner_accounts",
    (item: any) => item.pumpId === pumpId
  );
  return data ? (data as any) : null;
}

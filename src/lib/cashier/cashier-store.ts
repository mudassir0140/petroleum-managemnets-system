import { getStorageService } from "@/lib/storage/localStorage-service";
import type { CashierAccount } from "@/lib/cashier/types";

export async function findCashierById(id: string): Promise<CashierAccount | null> {
  if (typeof window === "undefined") return null;
  const service = getStorageService();
  const data = service.read("cashier_accounts", id);
  return data ? (data as any) : null;
}

import { getStorageService } from "@/lib/storage/localStorage-service";
import type { SecurityGuardAccount } from "@/lib/security-guard/types";

export async function findGuardById(id: string): Promise<SecurityGuardAccount | null> {
  if (typeof window === "undefined") return null;
  const service = getStorageService();
  const data = service.read("security_guard_accounts", id);
  return data ? (data as any) : null;
}

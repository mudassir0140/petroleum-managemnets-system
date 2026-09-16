import { getStorageService } from "./localStorage-service";
import type { AttendantAccount } from "@/lib/attendant/types";

const COLLECTION = "attendants";

export async function createAttendant(account: AttendantAccount): Promise<AttendantAccount> {
  const service = getStorageService();
  const data: any = {
    ...account,
    id: account.id,
  };
  service.create(COLLECTION, data);
  return account;
}

export async function findAttendantById(id: string): Promise<AttendantAccount | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, id);
  return data ? (data as any) : null;
}

export async function findAttendantByEmail(email: string): Promise<AttendantAccount | null> {
  const service = getStorageService();
  const data = service.findOne(
    COLLECTION,
    (item: any) => item.email?.toLowerCase() === email.toLowerCase()
  );
  return data ? (data as any) : null;
}

export async function getAllAttendants(): Promise<AttendantAccount[]> {
  const service = getStorageService();
  return service.readAll(COLLECTION) as any[];
}

export async function updateAttendant(
  id: string,
  updates: Partial<AttendantAccount>
): Promise<AttendantAccount | null> {
  const service = getStorageService();
  const updated = service.update(COLLECTION, id, updates);
  return updated ? (updated as any) : null;
}

export async function deleteAttendant(id: string): Promise<boolean> {
  const service = getStorageService();
  return service.delete(COLLECTION, id);
}

export async function seedDemoAttendant(account: AttendantAccount): Promise<void> {
  const existing = await findAttendantById(account.id);
  if (!existing) {
    await createAttendant(account);
  }
}

import { findAttendantById as findAttendantByIdInStorage } from "@/lib/storage/attendants-storage";
import type { AttendantAccount } from "@/lib/attendant/types";

export async function findAttendantById(id: string): Promise<AttendantAccount | null> {
  return findAttendantByIdInStorage(id);
}

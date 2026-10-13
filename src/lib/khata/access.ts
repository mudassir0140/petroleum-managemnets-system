import type { Db, ObjectId } from "mongodb";
import { toObjectId } from "@/lib/khata/ids";

// Khata accounts are assigned to pump attendants by Admin (khataClients.assignedAttendantIds).
// An attendant may only see and add entries to accounts that list their own id
// and belong to their own pump. Every attendant khata route uses this one rule.
export function attendantAccountQuery(pumpId: ObjectId, attendantId: ObjectId) {
  return { pumpId, assignedAttendantIds: attendantId };
}

// Pump attendants must be real pump_employees of this pump, so an account can
// only be assigned to someone the pump actually employs as an attendant.
// Returns the de-duplicated ids, or null if any id is invalid or not an attendant of this pump.
export async function resolveAssignableAttendantIds(
  db: Db,
  pumpId: ObjectId,
  values: unknown
): Promise<ObjectId[] | null> {
  if (values === undefined || values === null) return [];
  if (!Array.isArray(values)) return null;

  const ids: ObjectId[] = [];
  for (const value of values) {
    const id = toObjectId(value);
    if (!id) return null;
    if (!ids.some((existing) => existing.equals(id))) ids.push(id);
  }
  if (ids.length === 0) return [];

  const count = await db.collection("pump_employees").countDocuments({
    _id: { $in: ids },
    pumpId,
    role: "pump-attendant",
  });
  return count === ids.length ? ids : null;
}

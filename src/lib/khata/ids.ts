import { ObjectId } from "mongodb";

// Pump, client and attendant ids arrive as strings from cookies and request
// bodies, but are stored as ObjectIds. Normalise once here so every query
// compares like with like. Returns null for anything that is not a valid id.
export function toObjectId(value: unknown): ObjectId | null {
  const s = String(value ?? "").trim();
  return /^[a-f0-9]{24}$/i.test(s) ? new ObjectId(s) : null;
}

import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";

// An employee session keeps a random token on the employee record (only its SHA-256
// hash is stored). The employee cookie carries the token. Logout removes the hash, so
// every copy of the cookie stops working at once.
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Pump staff live in pump_employees, company staff in employees (see employee-login).
function collectionFor(isPumpEmployee: boolean): string {
  return isPumpEmployee ? "pump_employees" : "employees";
}

export async function startEmployeeSession(userId: ObjectId, isPumpEmployee: boolean): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const db = await getDatabase();
  await db
    .collection(collectionFor(isPumpEmployee))
    .updateOne({ _id: userId }, { $set: { sessionTokenHash: hashToken(token), sessionStartedAt: new Date() } });
  return token;
}

export async function isEmployeeSessionValid(userId: string, token: string, isPumpEmployee: boolean): Promise<boolean> {
  if (!token || !/^[a-f0-9]{24}$/i.test(userId)) return false;
  const db = await getDatabase();
  const record = await db
    .collection(collectionFor(isPumpEmployee))
    .findOne({ _id: new ObjectId(userId) }, { projection: { sessionTokenHash: 1, status: 1 } });
  if (!record || (record.status && record.status !== "active") || typeof record.sessionTokenHash !== "string") return false;
  const given = Buffer.from(hashToken(token));
  const stored = Buffer.from(record.sessionTokenHash);
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

export async function endEmployeeSession(userId: string, isPumpEmployee: boolean): Promise<void> {
  if (!/^[a-f0-9]{24}$/i.test(userId)) return;
  const db = await getDatabase();
  await db
    .collection(collectionFor(isPumpEmployee))
    .updateOne({ _id: new ObjectId(userId) }, { $unset: { sessionTokenHash: "", sessionStartedAt: "" } });
}

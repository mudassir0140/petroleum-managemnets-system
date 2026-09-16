import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Built-in Node crypto (scrypt) instead of bcrypt — keeps the project free
// of new dependencies while still salting + using a deliberately slow KDF.
// Demo Role Login never checks a password, but each account store still
// seeds a passwordHash field to keep its account shape intact.
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, originalHash] = hash.split(":");
    if (!salt || !originalHash) return false;

    const newHash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return timingSafeEqual(Buffer.from(newHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

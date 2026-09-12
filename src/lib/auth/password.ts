import { randomBytes, scryptSync } from "crypto";

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

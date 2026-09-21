import crypto from "crypto";

const HASH_ALGORITHM = "sha256";
const SALT_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto
    .createHmac(HASH_ALGORITHM, salt)
    .update(password)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, hashPart] = hash.split(":");
  if (!salt || !hashPart) return false;

  const computedHash = crypto
    .createHmac(HASH_ALGORITHM, salt)
    .update(password)
    .digest("hex");

  return computedHash === hashPart;
}

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
  console.log("[PasswordVerify] Starting verification");
  console.log("[PasswordVerify] Hash format check:", {
    hashLength: hash?.length,
    hasColon: hash?.includes(":"),
  });

  const [salt, hashPart] = hash.split(":");
  console.log("[PasswordVerify] Split result:", {
    hasSalt: !!salt,
    saltLength: salt?.length,
    hasHashPart: !!hashPart,
    hashPartLength: hashPart?.length,
  });

  if (!salt || !hashPart) {
    console.log("[PasswordVerify] FAIL: Invalid hash format");
    return false;
  }

  const computedHash = crypto
    .createHmac(HASH_ALGORITHM, salt)
    .update(password)
    .digest("hex");

  const isValid = computedHash === hashPart;
  console.log("[PasswordVerify] Comparison:", {
    isValid,
    computedHashLength: computedHash.length,
    storedHashLength: hashPart.length,
  });

  return isValid;
}

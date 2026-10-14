import crypto from "crypto";

// Reversible encryption for supplier passwords, so the owner can show and copy them.
//
// The key source is read from the environment on every call, never at module load:
//   1. SUPPLIER_SECRET, if it is set (any non-empty value).
//   2. Otherwise a key derived from MONGODB_URI, which the app already requires.
// The app has no other secret to reuse, so supplier creation and login never depend on
// SUPPLIER_SECRET being set. Login checks a password hash, so it doesn't use this key at all.
// The secret value is never logged or returned.
//
// Note: a key derived from MONGODB_URI changes if that connection string changes. Passwords
// encrypted under the old key then can't be shown (the owner sees an error, not a crash).

const DERIVED_KEY_CONTEXT = "petromanage:supplier-passwords:v1";

function keySource(): string {
  const explicit = (process.env.SUPPLIER_SECRET ?? "").trim();
  if (explicit !== "") return explicit;

  const uri = (process.env.MONGODB_URI ?? "").trim();
  if (uri !== "") return `${DERIVED_KEY_CONTEXT}:${uri}`;

  throw new Error("No key for supplier passwords: set SUPPLIER_SECRET or MONGODB_URI");
}

function encryptionKey(): Buffer {
  return crypto.createHash("sha256").update(keySource()).digest();
}

// Output format: iv:authTag:ciphertext, all hex.
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Stored secret is malformed");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}

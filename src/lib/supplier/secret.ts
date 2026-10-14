import crypto from "crypto";

// Reversible encryption for supplier passwords, so the owner can show and copy them.
// The key comes from SUPPLIER_SECRET in the server environment. There is no fallback:
// without the key, supplier passwords can't be stored or read.

function encryptionKey(): Buffer {
  const secret = process.env.SUPPLIER_SECRET ?? "";
  if (secret.length < 16) {
    throw new Error("SUPPLIER_SECRET is not set (use at least 16 characters)");
  }
  return crypto.createHash("sha256").update(secret).digest();
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

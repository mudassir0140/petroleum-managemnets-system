// Payment tracking rules: methods, method fields, statuses, duplicate keys, proof images and running balances.
// Pure: no imports, so the server, the pages and the tests all use the same rules.

export const PAYMENT_METHODS = ["cash", "cheque", "bank-transfer", "mobile-wallet"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABELS: Record<PaymentMethod, { en: string; ur: string }> = {
  cash: { en: "Cash", ur: "نقد" },
  cheque: { en: "Cheque", ur: "چیک" },
  "bank-transfer": { en: "Bank transfer", ur: "بینک ٹرانسفر" },
  "mobile-wallet": { en: "Mobile wallet", ur: "موبائل والیٹ" },
};

// A stored payment's status. Only "confirmed" counts towards dues and confirmed balances.
// Payments saved before statuses existed have no status and count as confirmed.
export type PaymentStatus = "pending" | "confirmed" | "bounced";

export const STATUS_LABELS: Record<PaymentStatus, { en: string; ur: string }> = {
  pending: { en: "Pending", ur: "زیرِ التوا" },
  confirmed: { en: "Confirmed", ur: "تصدیق شدہ" },
  bounced: { en: "Bounced", ur: "واپس" },
};

// What "confirmed" is called for each method.
export function confirmedLabel(method: string): string {
  if (method === "cheque") return "Cleared";
  if (method === "bank-transfer" || method === "mobile-wallet") return "Verified";
  return "Received";
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

// Payments saved before statuses existed have no status: they are confirmed.
export function isCounted(status: unknown): boolean {
  return status === undefined || status === null || status === "" || status === "confirmed";
}

const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isDateOnlyValue(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export interface MethodDetails {
  amount: number;
  date: string;
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
  bankAccount?: string;
  transactionId?: string;
  walletProvider?: string;
}

// Checks the fields a method needs and returns them trimmed. Missing or malformed fields are reported
// by name, so the form can point at the one that needs fixing.
export function validateMethodDetails(method: PaymentMethod, raw: Record<string, unknown>): { ok: true; value: MethodDetails } | { ok: false; error: string } {
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  const amount = typeof raw.amount === "number" ? raw.amount : parseFloat(text("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter an amount greater than 0" };
  const date = text("date");
  if (!isDateOnlyValue(date)) return { ok: false, error: "Enter a valid date" };

  const value: MethodDetails = { amount, date };
  if (method === "cheque") {
    const chequeNumber = text("chequeNumber");
    if (!/^[A-Za-z0-9-]{3,30}$/.test(chequeNumber)) return { ok: false, error: "Enter the cheque number (3 to 30 letters or digits)" };
    const bankName = text("bankName");
    if (bankName.length < 2 || bankName.length > 80) return { ok: false, error: "Enter the bank name on the cheque" };
    const chequeDate = text("chequeDate");
    if (!isDateOnlyValue(chequeDate)) return { ok: false, error: "Enter the cheque date" };
    Object.assign(value, { chequeNumber, bankName, chequeDate });
  } else if (method === "bank-transfer") {
    const bankAccount = text("bankAccount");
    if (bankAccount.length < 3 || bankAccount.length > 60) return { ok: false, error: "Enter the bank account the money went to" };
    const transactionId = text("transactionId");
    if (!/^[A-Za-z0-9-_/]{4,60}$/.test(transactionId)) return { ok: false, error: "Enter the transaction or reference ID (4 to 60 characters)" };
    Object.assign(value, { bankAccount, transactionId });
  } else if (method === "mobile-wallet") {
    const walletProvider = text("walletProvider");
    if (walletProvider.length < 2 || walletProvider.length > 40) return { ok: false, error: "Enter the wallet provider, for example JazzCash or Easypaisa" };
    const transactionId = text("transactionId");
    if (!/^[A-Za-z0-9-_/]{4,60}$/.test(transactionId)) return { ok: false, error: "Enter the wallet transaction ID (4 to 60 characters)" };
    Object.assign(value, { walletProvider, transactionId });
  }
  return { ok: true, value };
}

// The key that stops the same cheque or transfer from being recorded twice. Null for cash.
export function referenceKey(method: PaymentMethod, value: Partial<MethodDetails>): string | null {
  const low = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  if (method === "cheque") return `cheque|${low(value.bankName)}|${low(value.chequeNumber)}`;
  if (method === "bank-transfer") return `bank|${low(value.bankAccount)}|${low(value.transactionId)}`;
  if (method === "mobile-wallet") return `wallet|${low(value.walletProvider)}|${low(value.transactionId)}`;
  return null;
}

// The status a new payment starts in. Client submissions always wait for the owner. Cash is received at once.
// A cheque waits until it clears. A bank or wallet payment waits until it is verified, unless the owner verifies it
// at entry.
export function initialStatus(method: PaymentMethod, source: "owner" | "client", ownerVerified: boolean): PaymentStatus {
  if (source === "client") return "pending";
  if (method === "cash") return "confirmed";
  if (method === "cheque") return "pending";
  return ownerVerified ? "confirmed" : "pending";
}

// The only status changes allowed. A bounced payment is final; cash has no status changes.
export function transitionAllowed(method: string, from: PaymentStatus, to: PaymentStatus): { ok: true } | { ok: false; error: string } {
  if (method === "cash") return { ok: false, error: "Cash payments are received at once and cannot change status" };
  if (from === to) return { ok: false, error: `This payment is already ${STATUS_LABELS[to].en.toLowerCase()}` };
  if (from === "bounced") return { ok: false, error: "A bounced payment cannot change status" };
  if (from === "pending" && (to === "confirmed" || to === "bounced")) return { ok: true };
  if (method === "cheque" && from === "confirmed" && to === "bounced") return { ok: true };
  return { ok: false, error: `A ${STATUS_LABELS[from].en.toLowerCase()} payment cannot become ${STATUS_LABELS[to].en.toLowerCase()}` };
}

// A status change may carry the status the owner saw when they made it (`expectedFrom`). That lets a change saved
// offline be replayed safely: it applies only if the payment is still in that state, or is already in the target
// state (the earlier attempt got through). If anyone has moved the payment on, the change is refused, so an old
// decision never overwrites a newer one. Without `expectedFrom`, the change applies as before.
export type StatusPrecondition = "apply" | "already-applied" | "changed";

export function statusPrecondition(current: PaymentStatus, expectedFrom: PaymentStatus | undefined, to: PaymentStatus): StatusPrecondition {
  if (expectedFrom === undefined || current === expectedFrom) return "apply";
  if (current === to) return "already-applied";
  return "changed";
}

// Proof images: JPEG, PNG or WebP, up to 3 MB. The type comes from the file's own bytes, never from its name.
export const MAX_PROOF_BYTES = 3 * 1024 * 1024;

export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return "image/png";
  const ascii = (from: number, text: string) => text.split("").every((c, i) => bytes[from + i] === c.charCodeAt(0));
  if (bytes.length >= 12 && ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  return null;
}

export function validateProof(bytes: Uint8Array): { ok: true; mime: string } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: "The file is empty" };
  if (bytes.length > MAX_PROOF_BYTES) return { ok: false, error: "The image is larger than 3 MB" };
  const mime = sniffImage(bytes);
  if (!mime) return { ok: false, error: "Upload a JPEG, PNG or WebP image" };
  return { ok: true, mime };
}

// A client's idempotency key: the same submission sent twice gets the same key and is stored once.
export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9-]{8,64}$/.test(value);
}

export interface BalanceEvent {
  id: string;
  // Sortable date-time: "YYYY-MM-DD" with an optional time after it. Fuel of a day comes before payments of that day.
  at: string;
  kind: "fuel" | "payment";
  amount: number;
}

// The remaining khata balance after each event, in whole paisa. Only counted payments may be included.
export function runningBalances(events: BalanceEvent[]): Map<string, number> {
  const sorted = [...events].sort((a, b) => {
    if (a.at !== b.at) return a.at < b.at ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === "fuel" ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const out = new Map<string, number>();
  let balance = 0;
  for (const event of sorted) {
    const paisa = Math.round(event.amount * 100);
    balance += event.kind === "fuel" ? paisa : -paisa;
    out.set(event.id, balance / 100);
  }
  return out;
}

export interface TotalsRecord {
  method: string;
  status?: string | null;
  amount: number;
}

// Totals by method, in paisa: confirmed, pending and bounced. Bounced amounts never count as received.
export function totalsByMethod(records: TotalsRecord[]): Record<PaymentMethod, { confirmed: number; pending: number; bounced: number }> {
  const out = {} as Record<PaymentMethod, { confirmed: number; pending: number; bounced: number }>;
  for (const method of PAYMENT_METHODS) out[method] = { confirmed: 0, pending: 0, bounced: 0 };
  for (const r of records) {
    if (!isPaymentMethod(r.method)) continue;
    const paisa = Math.round(r.amount * 100);
    if (r.status === "pending") out[r.method].pending += paisa;
    else if (r.status === "bounced") out[r.method].bounced += paisa;
    else out[r.method].confirmed += paisa;
  }
  for (const method of PAYMENT_METHODS) {
    out[method].confirmed /= 100;
    out[method].pending /= 100;
    out[method].bounced /= 100;
  }
  return out;
}

// The unique key a request carries in its Idempotency-Key header (the offline queue sets it). A missing or
// malformed key is ignored, so an ordinary request works as before.
export function idempotencyKeyFrom(headers: Headers): string | undefined {
  const value = headers.get("Idempotency-Key");
  return isValidIdempotencyKey(value) ? value : undefined;
}

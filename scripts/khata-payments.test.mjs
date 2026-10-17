// Tests for payment methods, method fields, statuses, duplicates, proof images and balances.
// Run with: node --test scripts/khata-payments.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_METHODS,
  isPaymentMethod,
  isCounted,
  validateMethodDetails,
  referenceKey,
  initialStatus,
  transitionAllowed,
  sniffImage,
  validateProof,
  MAX_PROOF_BYTES,
  isValidIdempotencyKey,
  runningBalances,
  totalsByMethod,
  confirmedLabel,
} from "../src/lib/khata/payments.ts";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP"), 0]);

test("the methods are cash, cheque, bank transfer and mobile wallet; Other is gone", () => {
  assert.deepEqual([...PAYMENT_METHODS], ["cash", "cheque", "bank-transfer", "mobile-wallet"]);
  assert.equal(isPaymentMethod("other"), false);
  assert.equal(isPaymentMethod("cheque"), true);
});

test("a cheque needs its number, bank, cheque date and amount", () => {
  const ok = validateMethodDetails("cheque", { amount: "5000", date: "2026-10-03", chequeNumber: " 001234 ", bankName: "HBL", chequeDate: "2026-10-05" });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.chequeNumber, "001234", "trimmed");
  assert.equal(validateMethodDetails("cheque", { amount: "5000", date: "2026-10-03", bankName: "HBL", chequeDate: "2026-10-05" }).ok, false, "no number");
  assert.equal(validateMethodDetails("cheque", { amount: "5000", date: "2026-10-03", chequeNumber: "001", bankName: "H", chequeDate: "2026-10-05" }).ok, false, "bank name too short");
  assert.equal(validateMethodDetails("cheque", { amount: "5000", date: "2026-10-03", chequeNumber: "001", bankName: "HBL", chequeDate: "2026-02-30" }).ok, false, "impossible date");
});

test("a bank transfer needs the account, the reference, the date and the amount", () => {
  const ok = validateMethodDetails("bank-transfer", { amount: 2500, date: "2026-10-03", bankAccount: "HBL 0012-3456", transactionId: "TRX/20261003-9" });
  assert.equal(ok.ok, true);
  assert.equal(validateMethodDetails("bank-transfer", { amount: 2500, date: "2026-10-03", bankAccount: "HBL 0012", transactionId: "ab" }).ok, false, "reference too short");
  assert.equal(validateMethodDetails("bank-transfer", { amount: 0, date: "2026-10-03", bankAccount: "HBL 0012", transactionId: "TRX1234" }).ok, false, "amount must be above 0");
});

test("a wallet payment needs the provider and the transaction ID; cash needs only the amount and date", () => {
  assert.equal(validateMethodDetails("mobile-wallet", { amount: 900, date: "2026-10-03", walletProvider: "JazzCash", transactionId: "JC998877" }).ok, true);
  assert.equal(validateMethodDetails("mobile-wallet", { amount: 900, date: "2026-10-03", transactionId: "JC998877" }).ok, false, "no provider");
  assert.equal(validateMethodDetails("cash", { amount: 400, date: "2026-10-03" }).ok, true);
});

test("the same cheque or transfer cannot be recorded twice, whatever the case", () => {
  const a = referenceKey("cheque", { bankName: "HBL", chequeNumber: "001234" });
  const b = referenceKey("cheque", { bankName: " hbl ", chequeNumber: "001234" });
  assert.equal(a, b);
  assert.notEqual(a, referenceKey("cheque", { bankName: "UBL", chequeNumber: "001234" }));
  assert.equal(referenceKey("bank-transfer", { bankAccount: "HBL 1", transactionId: "TX1" }), referenceKey("bank-transfer", { bankAccount: "hbl 1", transactionId: "tx1" }));
  assert.equal(referenceKey("cash", {}), null);
});

test("status at entry: cash is received, cheques wait, bank and wallet wait unless verified, client submissions wait", () => {
  assert.equal(initialStatus("cash", "owner", false), "confirmed");
  assert.equal(initialStatus("cheque", "owner", true), "pending", "a cheque is never cleared on entry");
  assert.equal(initialStatus("bank-transfer", "owner", false), "pending");
  assert.equal(initialStatus("bank-transfer", "owner", true), "confirmed");
  assert.equal(initialStatus("mobile-wallet", "client", true), "pending", "a client's submission waits even if marked verified");
});

test("status changes: cheques clear or bounce, a cleared cheque can bounce later, bounced is final", () => {
  assert.equal(transitionAllowed("cheque", "pending", "confirmed").ok, true);
  assert.equal(transitionAllowed("cheque", "pending", "bounced").ok, true);
  assert.equal(transitionAllowed("cheque", "confirmed", "bounced").ok, true);
  assert.equal(transitionAllowed("cheque", "bounced", "confirmed").ok, false);
  assert.equal(transitionAllowed("bank-transfer", "confirmed", "bounced").ok, false, "only a cheque can bounce after it clears");
  assert.equal(transitionAllowed("cash", "pending", "confirmed").ok, false);
  assert.equal(transitionAllowed("mobile-wallet", "pending", "pending").ok, false);
});

test("only pending or confirmed payments count, and legacy payments without a status count", () => {
  assert.equal(isCounted("confirmed"), true);
  assert.equal(isCounted(undefined), true, "saved before statuses");
  assert.equal(isCounted("pending"), false);
  assert.equal(isCounted("bounced"), false);
  assert.equal(confirmedLabel("cheque"), "Cleared");
  assert.equal(confirmedLabel("mobile-wallet"), "Verified");
});

test("proof images are checked by their bytes, size and type", () => {
  assert.equal(sniffImage(JPEG), "image/jpeg");
  assert.equal(sniffImage(PNG), "image/png");
  assert.equal(sniffImage(WEBP), "image/webp");
  assert.equal(sniffImage(new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74])), null, "a script is not an image");
  assert.equal(validateProof(JPEG).ok, true);
  assert.equal(validateProof(new Uint8Array([0x25, 0x50, 0x44, 0x46])).ok, false, "a PDF is refused");
  assert.equal(validateProof(new Uint8Array(0)).ok, false);
  assert.equal(validateProof(new Uint8Array(MAX_PROOF_BYTES + 1)).ok, false, "over 3 MB");
});

test("an idempotency key must be a sane token", () => {
  assert.equal(isValidIdempotencyKey("a1b2c3d4-e5f6"), true);
  assert.equal(isValidIdempotencyKey("short"), false);
  assert.equal(isValidIdempotencyKey("has spaces here"), false);
});

test("the remaining khata balance after each transaction", () => {
  const balances = runningBalances([
    { id: "fuel1", at: "2026-10-01", kind: "fuel", amount: 1000 },
    { id: "pay1", at: "2026-10-05", kind: "payment", amount: 400 },
    { id: "fuel2", at: "2026-10-05", kind: "fuel", amount: 250 },
    { id: "pay2", at: "2026-10-09T10:00", kind: "payment", amount: 850 },
  ]);
  assert.equal(balances.get("fuel1"), 1000);
  // Same-day fuel (250) counts before that day payment (400): 1000 + 250 - 400 = 850.
  assert.equal(balances.get("pay1"), 850);
  assert.equal(balances.get("fuel2"), 1250, "fuel on the same day counts before that day payment");
  assert.equal(balances.get("pay2"), 0);
});

test("totals by method keep confirmed, pending and bounced apart", () => {
  const totals = totalsByMethod([
    { method: "cash", amount: 100 },
    { method: "cheque", amount: 300, status: "pending" },
    { method: "cheque", amount: 200, status: "confirmed" },
    { method: "cheque", amount: 50, status: "bounced" },
    { method: "bank-transfer", amount: 700, status: "confirmed" },
    { method: "mobile-wallet", amount: 90.1, status: "pending" },
    { method: "other", amount: 999 },
  ]);
  assert.equal(totals.cash.confirmed, 100);
  assert.equal(totals.cheque.confirmed, 200, "pending and bounced are not received");
  assert.equal(totals.cheque.pending, 300);
  assert.equal(totals.cheque.bounced, 50);
  assert.equal(totals["bank-transfer"].confirmed, 700);
  assert.equal(totals["mobile-wallet"].pending, 90.1);
});

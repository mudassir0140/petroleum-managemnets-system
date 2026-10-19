// Tests for queued payment status changes (verify, clear, bounce) and their replay rule.
// Run with: node --test scripts/offline-rules-phase5.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isQueueable } from "../src/lib/offline/rules.ts";
import { statusPrecondition } from "../src/lib/khata/payments.ts";

const id = "64b0000000000000000000aa";

test("a payment status change may be queued, for a real payment id only", () => {
  assert.equal(isQueueable("POST", `/api/khata/payments/${id}/status`), true);
  assert.equal(isQueueable("POST", "/api/khata/payments/not-an-id/status"), false);
  assert.equal(isQueueable("GET", `/api/khata/payments/${id}/status`), false);
});

test("a replay applies only while the payment is still in the state the owner saw", () => {
  assert.equal(statusPrecondition("pending", "pending", "confirmed"), "apply");
  assert.equal(statusPrecondition("confirmed", "confirmed", "bounced"), "apply");
});

test("a replay after the change already went through does nothing and is not an error", () => {
  assert.equal(statusPrecondition("confirmed", "pending", "confirmed"), "already-applied");
  assert.equal(statusPrecondition("bounced", "confirmed", "bounced"), "already-applied");
});

test("a change is refused when someone else moved the payment on", () => {
  assert.equal(statusPrecondition("bounced", "pending", "confirmed"), "changed", "a bounced payment must not be cleared by an old queued change");
  assert.equal(statusPrecondition("confirmed", "pending", "bounced"), "changed", "a confirmed payment must not be bounced by an old queued change");
});

test("without an expected status the change applies as before", () => {
  assert.equal(statusPrecondition("pending", undefined, "confirmed"), "apply");
});

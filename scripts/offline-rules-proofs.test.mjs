// Tests for queueing a proof image for a saved payment. Run with: node --test scripts/offline-rules-proofs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isQueueable } from "../src/lib/offline/rules.ts";

const id = "64b0000000000000000000aa";

test("a proof image for a saved owner or client payment may be queued", () => {
  assert.equal(isQueueable("POST", `/api/khata/payments/${id}/proof`), true);
  assert.equal(isQueueable("POST", `/api/khata/client/payments/${id}/proof`), true);
});

test("only a real payment id is queued for proofs", () => {
  assert.equal(isQueueable("POST", "/api/khata/payments/not-an-id/proof"), false);
  assert.equal(isQueueable("POST", `/api/khata/payments/${id}/proof/extra`), false);
  assert.equal(isQueueable("GET", `/api/khata/payments/${id}/proof`), false);
});

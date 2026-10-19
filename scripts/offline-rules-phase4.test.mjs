// Tests for the queue rules added with the client payment submission and the employee shift-hours update.
// Run with: node --test scripts/offline-rules-phase4.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isQueueable } from "../src/lib/offline/rules.ts";

const id = "64b0000000000000000000aa";

test("a client's own payment submission may be queued", () => {
  assert.equal(isQueueable("POST", "/api/khata/client/payments"), true);
});

test("changing an employee's shift hours may be queued, for a real employee id only", () => {
  assert.equal(isQueueable("PUT", `/api/pumpadmin/employees/${id}`), true);
  assert.equal(isQueueable("PUT", "/api/pumpadmin/employees/not-an-id"), false);
  assert.equal(isQueueable("DELETE", `/api/pumpadmin/employees/${id}`), false, "deleting is never queued");
});

test("writes that stay online-only are never queued", () => {
  assert.equal(isQueueable("POST", "/api/pumpadmin/employees"), false, "creating a login carries a password");
  assert.equal(isQueueable("POST", "/api/khata/clients"), false, "creating a login carries a password");
  assert.equal(isQueueable("POST", "/api/pumpadmin/trucks"), false, "creating a login carries a password");
  assert.equal(isQueueable("POST", "/api/pumpadmin/fuel-rates"), false, "a late replay could undo a newer price");
  assert.equal(isQueueable("POST", "/api/khata/months/close"), false);
  assert.equal(isQueueable("POST", "/api/khata/clients/64b0000000000000000000aa/reset-password"), false);
  assert.equal(isQueueable("POST", "/api/truck/location"), false, "live location is never queued");
  assert.equal(isQueueable("PUT", "/api/pump-owner/confirm-delivery"), false, "delivery confirmation is never queued");
});

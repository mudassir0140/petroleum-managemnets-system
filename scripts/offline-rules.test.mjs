// Offline queue rules: which writes are queued, what a server answer means for a queued write, and how a queued
// proof image waits for its payment. Run with: node --test scripts/offline-rules.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isQueueable, outcomeFor, PAYMENT_TOKEN, queuedPathname, retryDelayMs } from "../src/lib/offline/rules.ts";
import { scopeFor, SCOPE_COOKIES } from "../src/lib/offline/scope.ts";

const ID = "64b7f0c2a1b2c3d4e5f60718";

test("the module writes that may be queued are the ones listed in the rules", () => {
  for (const path of [
    "/api/pump-owner/sales",
    "/api/pump-owner/fuel-orders",
    "/api/attendant/shifts/start",
    "/api/attendant/shifts/end",
    "/api/attendant/khata-entries",
    "/api/khata/payments",
    "/api/khata/client/payments",
    `/api/khata/payments/${ID}/proof`,
  ]) {
    assert.equal(isQueueable("POST", path), true, path);
  }
});

test("reads, status changes, edits, deletes, logins and other-party actions are never queued", () => {
  assert.equal(isQueueable("GET", "/api/pump-owner/sales"), false);
  assert.equal(isQueueable("POST", `/api/khata/payments/${ID}/status`), false);
  assert.equal(isQueueable("PUT", `/api/khata/payments/${ID}`), false);
  assert.equal(isQueueable("DELETE", "/api/pump-owner/sales"), false);
  assert.equal(isQueueable("POST", "/api/pump-owner/confirm-delivery"), false);
  assert.equal(isQueueable("POST", "/api/pumpadmin/orders/abc/cancel"), false);
  assert.equal(isQueueable("POST", "/api/auth/login"), false);
  assert.equal(isQueueable("POST", "/api/khata/payments/not-an-id/proof"), false);
  assert.equal(isQueueable("POST", "/api/attendant/shifts/other"), false);
});

test("a proof URL that still holds the payment placeholder is checked by its shape", () => {
  assert.equal(queuedPathname(`/api/khata/payments/${PAYMENT_TOKEN}/proof`), "/api/khata/payments/000000000000000000000000/proof");
  assert.equal(isQueueable("POST", queuedPathname(`/api/khata/payments/${PAYMENT_TOKEN}/proof`)), true);
  assert.equal(isQueueable("POST", queuedPathname(`/api/khata/client/payments/${PAYMENT_TOKEN}/proof`)), false);
});

test("a saved or already-saved answer removes the queued change", () => {
  assert.equal(outcomeFor(200), "done");
  assert.equal(outcomeFor(201), "done");
});

test("no session means the change waits for sign-in, it is not dropped", () => {
  assert.equal(outcomeFor(401), "sign-in");
  assert.equal(outcomeFor(403), "sign-in");
});

test("busy, unreachable and still-saving answers are retried", () => {
  assert.equal(outcomeFor(408), "retry");
  assert.equal(outcomeFor(429), "retry");
  assert.equal(outcomeFor(500), "retry");
  assert.equal(outcomeFor(503), "retry");
});

test("validation and other refusals are kept for review, never retried blindly", () => {
  assert.equal(outcomeFor(400), "failed");
  assert.equal(outcomeFor(404), "failed");
  assert.equal(outcomeFor(409), "failed");
  assert.equal(outcomeFor(422), "failed");
});

test("retry delay grows and is capped at five minutes", () => {
  assert.equal(retryDelayMs(0), 5_000);
  assert.equal(retryDelayMs(1), 10_000);
  assert.equal(retryDelayMs(2), 20_000);
  assert.equal(retryDelayMs(50), 5 * 60_000);
});

test("the account scope identifies the signed-in account and changes when it changes", () => {
  assert.equal(scopeFor({}), "", "signed out has an empty scope");
  const owner = { pump_owner_session: JSON.stringify({ pumpId: "a1", role: "pump-owner" }) };
  const other = { pump_owner_session: JSON.stringify({ pumpId: "b2", role: "pump-owner" }) };
  assert.match(scopeFor(owner), /^[0-9a-f]{64}$/);
  assert.equal(scopeFor(owner), scopeFor({ ...owner }), "same account, same scope");
  assert.notEqual(scopeFor(owner), scopeFor(other), "another account, another scope");
  assert.ok(SCOPE_COOKIES.includes("pump_owner_session"));
});

test("the scope digest does not contain the cookie value", () => {
  const scope = scopeFor({ admin_session: "super-secret-value" });
  assert.equal(scope.includes("super-secret-value"), false);
});

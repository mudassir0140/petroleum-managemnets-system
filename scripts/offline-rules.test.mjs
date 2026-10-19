// Tests for the offline queue rules: what may be queued, what each server answer means, and the retry wait.
// Run with: node --test scripts/offline-rules.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isQueueable, outcomeFor, retryDelayMs } from "../src/lib/offline/rules.ts";

test("only the supported khata writes may be queued", () => {
  assert.equal(isQueueable("POST", "/api/attendant/khata-entries"), true);
  assert.equal(isQueueable("POST", "/api/khata/payments"), true);
  assert.equal(isQueueable("post", "/api/khata/payments"), true, "the method is case-insensitive");
  assert.equal(isQueueable("POST", "/api/khata/months/close"), false, "closing a month is not queued");
  assert.equal(isQueueable("PUT", "/api/khata/payments/64b0000000000000000000aa"), false);
  assert.equal(isQueueable("GET", "/api/khata/payments"), false, "reads are never queued");
  assert.equal(isQueueable("POST", "/api/supplier/auth/login"), false, "logins are never queued");
});

test("a saved answer (2xx) removes the queued copy", () => {
  assert.equal(outcomeFor(200), "done");
  assert.equal(outcomeFor(201), "done");
  assert.equal(outcomeFor(202), "done");
});

test("a missing session waits for the next sign-in, and is not dropped", () => {
  assert.equal(outcomeFor(401), "sign-in");
  assert.equal(outcomeFor(403), "sign-in");
});

test("a busy or unreachable server is retried later", () => {
  assert.equal(outcomeFor(408), "retry");
  assert.equal(outcomeFor(429), "retry");
  assert.equal(outcomeFor(500), "retry");
  assert.equal(outcomeFor(503), "retry");
});

test("a refused change is kept for review and never retried blindly", () => {
  assert.equal(outcomeFor(400), "failed", "invalid data");
  assert.equal(outcomeFor(404), "failed", "khata not found");
  assert.equal(outcomeFor(409), "failed", "a cheque or transfer already recorded, or a closed month");
});

test("the retry wait doubles and is capped at five minutes", () => {
  assert.equal(retryDelayMs(0), 5_000);
  assert.equal(retryDelayMs(1), 10_000);
  assert.equal(retryDelayMs(2), 20_000);
  assert.equal(retryDelayMs(50), 5 * 60_000);
  for (let attempt = 0; attempt < 60; attempt++) {
    assert.ok(retryDelayMs(attempt) <= 5 * 60_000);
  }
});

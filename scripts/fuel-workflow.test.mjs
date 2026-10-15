// Tests for the fuel delivery workflow rules and travelled distance.
// Run with: node --test scripts/fuel-workflow.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTransition, confirmationOutcome, requestStage, ACTIVE_REQUEST_STATUSES } from "../src/lib/supplier/fuel-workflow.ts";
import { travelStepMeters, MAX_TRAVEL_STEP_M } from "../src/lib/truck/gps.ts";

test("Requested -> Processing -> On The Way -> Arrived is the only forward path", () => {
  assert.deepEqual(checkTransition("pending-driver", "driver-accept", "driver"), { ok: true, to: "pending-supplier" });
  assert.deepEqual(checkTransition("pending-supplier", "supplier-accept", "supplier"), { ok: true, to: "accepted" });
  assert.deepEqual(checkTransition("accepted", "supplier-dispatch", "supplier"), { ok: true, to: "on-the-way" });
  assert.deepEqual(checkTransition("on-the-way", "arrive", "gps"), { ok: true, to: "arrived" });
  assert.deepEqual(checkTransition("on-the-way", "arrive", "driver"), { ok: true, to: "arrived" });
});

test("steps cannot be skipped or repeated", () => {
  assert.equal(checkTransition("pending-supplier", "supplier-dispatch", "supplier").ok, false, "cannot dispatch before accepting");
  assert.equal(checkTransition("accepted", "arrive", "gps").ok, false, "cannot arrive before dispatch");
  assert.equal(checkTransition("arrived", "supplier-dispatch", "supplier").ok, false, "cannot dispatch twice");
  assert.equal(checkTransition("on-the-way", "supplier-accept", "supplier").ok, false, "cannot accept twice");
  assert.equal(checkTransition("completed", "owner-confirm", "owner").ok, false, "completed requests are final");
});

test("roles are enforced per step", () => {
  assert.equal(checkTransition("pending-driver", "driver-accept", "supplier").status, 403);
  assert.equal(checkTransition("pending-supplier", "supplier-accept", "owner").status, 403);
  assert.equal(checkTransition("accepted", "supplier-dispatch", "driver").status, 403, "a driver cannot dispatch");
  assert.equal(checkTransition("arrived", "owner-confirm", "supplier").status, 403, "a supplier cannot confirm for the owner");
  assert.equal(checkTransition("on-the-way", "arrive", "owner").status, 403);
});

test("a wrong status is a conflict, not a permission error", () => {
  const result = checkTransition("accepted", "supplier-accept", "supplier");
  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
});

test("the request completes only after both confirmations, and duplicates are flagged", () => {
  const none = { supplierConfirmed: false, ownerConfirmed: false };
  assert.deepEqual(confirmationOutcome(none, "supplier"), { duplicate: false, complete: false });
  const supplierDone = { supplierConfirmed: true, ownerConfirmed: false };
  assert.deepEqual(confirmationOutcome(supplierDone, "supplier"), { duplicate: true, complete: false }, "duplicate supplier confirm");
  assert.deepEqual(confirmationOutcome(supplierDone, "owner"), { duplicate: false, complete: true });
  const ownerDone = { supplierConfirmed: false, ownerConfirmed: true };
  assert.deepEqual(confirmationOutcome(ownerDone, "owner"), { duplicate: true, complete: false }, "duplicate owner confirm");
});

test("stages map every stored status", () => {
  assert.equal(requestStage("pending-driver"), "requested");
  assert.equal(requestStage("accepted"), "processing");
  assert.equal(requestStage("on-the-way"), "on-the-way");
  assert.equal(requestStage("arrived"), "arrived");
  assert.equal(requestStage("completed"), "completed");
  assert.equal(requestStage("driver-rejected"), "rejected");
  assert.equal(requestStage("nonsense"), null);
});

test("a truck stays Busy through every active status", () => {
  assert.ok(ACTIVE_REQUEST_STATUSES.includes("on-the-way"));
  assert.ok(ACTIVE_REQUEST_STATUSES.includes("arrived"));
  assert.ok(!ACTIVE_REQUEST_STATUSES.includes("completed"));
});

test("travelled distance adds accurate steps only", () => {
  const a = { lat: 31.5, lng: 74.3 };
  const b = { lat: 31.501, lng: 74.3 }; // about 111 m north
  const step = travelStepMeters(a, b, 20);
  assert.ok(step > 100 && step < 120, `got ${step}`);
  assert.equal(travelStepMeters(null, b, 20), 0, "no earlier fix: nothing to add");
  assert.equal(travelStepMeters(a, b, 0), 0, "unknown accuracy adds nothing");
  assert.equal(travelStepMeters(a, b, 250), 0, "poor accuracy adds nothing");
  const far = { lat: 31.6, lng: 74.3 }; // about 11 km
  assert.equal(travelStepMeters(a, far, 20), 0, `a jump over ${MAX_TRAVEL_STEP_M} m is a bad fix`);
});

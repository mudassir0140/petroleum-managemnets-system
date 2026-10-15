// Tests for the GPS and delivery rules. Run with: node --test scripts/truck-gps.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVAL_RADIUS_M, GPS_STALE_AFTER_SECONDS, gpsState, haversineMeters, hasArrived, tripStage } from "../src/lib/truck/gps.ts";

const pump = { lat: 31.5204, lng: 74.3587 };

test("a fix is live, stale or missing by its age", () => {
  const now = 1_000_000;
  assert.equal(gpsState(null, now), "missing");
  assert.equal(gpsState(now - 5_000, now), "live");
  assert.equal(gpsState(now - (GPS_STALE_AFTER_SECONDS + 1) * 1000, now), "stale");
});

test("distance is about right (Lahore to Karachi is roughly 1,000 km)", () => {
  const karachi = { lat: 24.8607, lng: 67.0011 };
  const km = haversineMeters(pump, karachi) / 1000;
  assert.ok(km > 1000 && km < 1100, `got ${km}`);
});

test("arrival needs an accurate fix inside the radius", () => {
  const near = { lat: pump.lat + 0.001, lng: pump.lng }; // about 111 m
  assert.equal(hasArrived({ ...near, accuracy: 20 }, pump), true);
  assert.equal(hasArrived({ ...near, accuracy: 150 }, pump), false, "poor accuracy must not count");
  assert.equal(hasArrived({ ...near, accuracy: 0 }, pump), false, "unknown accuracy must not count");
  const far = { lat: pump.lat + 0.01, lng: pump.lng }; // about 1.1 km
  assert.equal(hasArrived({ ...far, accuracy: 10 }, pump), false);
  assert.ok(ARRIVAL_RADIUS_M > 0);
});

test("order statuses map to delivery stages", () => {
  assert.equal(tripStage("accepted"), "accepted");
  assert.equal(tripStage("dispatched"), "accepted");
  assert.equal(tripStage("on-the-way"), "on-the-way");
  assert.equal(tripStage("delivered"), "arrived");
  assert.equal(tripStage("completed"), "completed");
  assert.equal(tripStage("cancelled"), null);
});

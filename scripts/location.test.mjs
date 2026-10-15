// Tests for the location fields: required checks and the display line.
// Run with: node --test scripts/location.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLocation, formatLocation } from "../src/lib/location/fields.ts";

const full = { country: " Pakistan ", province: "Punjab", district: "Lahore", city: "Lahore", address: "Main Boulevard, Gulberg" };

test("a complete location is accepted and trimmed", () => {
  const result = validateLocation(full, ["country", "province", "district", "city"]);
  assert.equal(result.ok, true);
  assert.equal(result.value.country, "Pakistan");
});

test("each required field is enforced", () => {
  for (const field of ["country", "province", "district", "city"]) {
    const result = validateLocation({ ...full, [field]: "   " }, ["country", "province", "district", "city"]);
    assert.equal(result.ok, false, `${field} must be required`);
    assert.match(result.error, new RegExp(field === "province" ? "Province" : field[0].toUpperCase() + field.slice(1)));
  }
});

test("a pump also needs its complete address; a supplier does not", () => {
  const noAddress = { ...full, address: "" };
  assert.equal(validateLocation(noAddress, ["country", "province", "district", "city"]).ok, true);
  assert.equal(validateLocation(noAddress, ["country", "province", "district", "city", "address"]).ok, false);
});

test("missing and non-text values count as blank", () => {
  assert.equal(validateLocation({}, ["country"]).ok, false);
  assert.equal(validateLocation({ country: 42 }, ["country"]).ok, false);
});

test("over-long values are rejected", () => {
  assert.equal(validateLocation({ ...full, city: "x".repeat(201) }, []).ok, false);
});

test("the display line lists the most specific part first and skips blanks", () => {
  assert.equal(formatLocation(full), "Main Boulevard, Gulberg, Lahore, Lahore, Punjab, Pakistan");
  assert.equal(formatLocation({ city: "Hyderabad", province: "Sindh", country: "Pakistan" }), "Hyderabad, Sindh, Pakistan");
  assert.equal(formatLocation({}), "");
});

// Tests for the tanker driver username and its login lookup. Run with: node --test scripts/truck-username.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { driverUsername, normalizeTruckUsername, usernamePart } from "../src/lib/truck/username.ts";

test("the username is driver name @ pump name", () => {
  assert.equal(driverUsername("Ali Khan", "PSO"), "alikhan@pso");
  assert.equal(driverUsername("alikhan", "pso"), "alikhan@pso");
});

test("spaces, dots, apostrophes and symbols are removed from both parts", () => {
  assert.equal(driverUsername("  Ali  Khan. ", "P.S.O. Main!"), "alikhan@psomain");
  assert.equal(driverUsername("O'Brien-Jr", "Pump #2"), "obrienjr@pump2");
});

test("a clash suffix goes before the @", () => {
  assert.equal(driverUsername("Ali Khan", "PSO", "2"), "alikhan2@pso");
  assert.equal(driverUsername("Ali Khan", "PSO", "3"), "alikhan3@pso");
});

test("an empty part falls back to driver or pump, never to the old format", () => {
  assert.equal(driverUsername("", "PSO"), "driver@pso");
  assert.equal(driverUsername("Ali", ""), "ali@pump");
  assert.equal(driverUsername("علی", "پمپ"), "driver@pump");
});

test("the old pump-truck format is never produced", () => {
  const name = driverUsername("Ali Khan", "mudpump");
  assert.ok(!name.includes("-"), `no dash in ${name}`);
  assert.match(name, /^[a-z0-9]+@[a-z0-9]+$/);
});

test("usernamePart keeps only lowercase letters and digits", () => {
  assert.equal(usernamePart("Ahmed-Raza 99!"), "ahmedraza99");
});

test("the login identifier is matched in its stored form", () => {
  assert.equal(normalizeTruckUsername("  Ali Khan@PSO "), "alikhan@pso");
  assert.equal(normalizeTruckUsername("alikhan@pso"), "alikhan@pso");
  assert.equal(normalizeTruckUsername(driverUsername("Ali Khan", "PSO")), "alikhan@pso");
});

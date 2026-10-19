// Tests for Change Password rules. Run with: node --test scripts/password-rules.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { newPasswordError, minPasswordLength, MAX_PASSWORD_LENGTH } from "../src/lib/account/password-rules.ts";

test("pump owner: at least 8 characters", () => {
  assert.match(newPasswordError("pump-owner", "abc123"), /at least 8/);
  assert.equal(newPasswordError("pump-owner", "abcd1234"), null);
});

test("pump owner: must include a letter and a number", () => {
  assert.match(newPasswordError("pump-owner", "12345678"), /letter and one number/);
  assert.match(newPasswordError("pump-owner", "abcdefgh"), /letter and one number/);
  assert.equal(newPasswordError("pump-owner", "Owner2026"), null);
});

test("pump owner: refuses passwords longer than the maximum", () => {
  const tooLong = "a1".repeat(MAX_PASSWORD_LENGTH);
  assert.match(newPasswordError("pump-owner", tooLong), /at most/);
  assert.equal(newPasswordError("pump-owner", "a1".repeat(MAX_PASSWORD_LENGTH / 2)), null);
});

test("other roles keep their existing 6-character minimum, with no letter-and-number rule", () => {
  assert.match(newPasswordError("truck", "abc"), /at least 6/);
  assert.equal(newPasswordError("truck", "abcdef"), null);
  assert.equal(newPasswordError("supplier", "123456"), null);
  assert.equal(newPasswordError("attendant", "123456"), null);
});

test("minimum length shown in the form matches the role", () => {
  assert.equal(minPasswordLength("pump-owner"), 8);
  assert.equal(minPasswordLength("attendant"), 6);
});

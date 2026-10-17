// Tests for pump owner credentials: email creation, normalisation, validation, password hashing, and the
// create-then-login flow. Run with: node --test scripts/pump-owner-login.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeOwnerEmail,
  isValidOwnerEmail,
  ownerEmailFor,
  ownerPasswordFor,
  branchPasswordCheck,
  isPumpOwnerRole,
} from "../src/lib/auth/owner-credentials.ts";
import { hashPassword, verifyPassword } from "../src/lib/auth/password.ts";

test("the created email has no spaces or symbols that the login field rejects", () => {
  const email = ownerEmailFor("Mudassir Ali", "Khan Petroleum");
  assert.equal(email, "mudassirali@khanpetroleumgmail.com");
  assert.equal(isValidOwnerEmail(email), true);
  assert.equal(ownerEmailFor("O'Brien Jr.", "Star & Co"), "obrienjr@starcogmail.com");
  assert.equal(ownerEmailFor("", "Khan"), "", "no owner name, no email");
});

test("a name that would have produced an invalid email is caught by validation", () => {
  assert.equal(isValidOwnerEmail("mudassir ali@khanpetroleumgmail.com"), false, "a space in the address");
  assert.equal(isValidOwnerEmail("no-at-sign.com"), false);
  assert.equal(isValidOwnerEmail("owner@nodot"), false);
  assert.equal(isValidOwnerEmail("owner@pump.com"), true);
});

test("the typed email is trimmed and lower-cased before it is compared", () => {
  assert.equal(normalizeOwnerEmail("  Owner@Pump.COM "), "owner@pump.com");
  assert.equal(normalizeOwnerEmail(undefined), "");
  assert.equal(normalizeOwnerEmail(42), "");
});

test("the starting password is the owner name with a capital letter and 123", () => {
  assert.equal(ownerPasswordFor(" mudassir "), "Mudassir123");
  assert.equal(ownerPasswordFor("mudassir ali"), "Mudassir ali123");
});

test("a password is stored as a salted hash that verifies only the right password", () => {
  const hash = hashPassword("Mudassir123");
  assert.match(hash, /^[0-9a-f]{64}:[0-9a-f]{64}$/, "salt:hash");
  assert.equal(verifyPassword("Mudassir123", hash), true);
  assert.equal(verifyPassword("mudassir123", hash), false, "passwords are case-sensitive");
  assert.equal(verifyPassword("Mudassir123 ", hash), false, "the password is not trimmed on login, so a trailing space is different");
  assert.notEqual(hashPassword("Mudassir123"), hash, "each hash has its own salt");
  assert.equal(verifyPassword("x", "not-a-hash"), false);
});

test("a branch pump keeps the owner's password, and a different one is refused", () => {
  assert.deepEqual(branchPasswordCheck(false, "Anything1", false), { ok: true }, "a new owner sets the password");
  assert.deepEqual(branchPasswordCheck(true, undefined, false), { ok: true }, "no password typed: the owner's stays");
  assert.deepEqual(branchPasswordCheck(true, "Mudassir123", true), { ok: true });
  assert.equal(branchPasswordCheck(true, "Other999", false).ok, false);
});

test("only a pump owner account passes the role check", () => {
  assert.equal(isPumpOwnerRole("pump-owner"), true);
  assert.equal(isPumpOwnerRole(undefined), false);
  assert.equal(isPumpOwnerRole("admin"), false);
});

// The complete flow without a database: what the create form generates and what the create route stores,
// then what a typed login must match.
test("create then login: the typed credentials match what was stored", () => {
  const owner = "Mudassir Ali";
  const pump = "Khan Petroleum";
  const generatedEmail = ownerEmailFor(owner, pump);
  const generatedPassword = ownerPasswordFor(owner);

  // The create route stores the normalised email and a hash of the password.
  const stored = { ownerEmail: normalizeOwnerEmail(generatedEmail), ownerPasswordHash: hashPassword(generatedPassword), role: "pump-owner" };

  // The owner types the email in any case, with stray spaces, and the password exactly.
  const typedEmail = `  ${generatedEmail.toUpperCase()} `;
  const typedPassword = generatedPassword;

  assert.equal(normalizeOwnerEmail(typedEmail), stored.ownerEmail, "the email matches");
  assert.equal(verifyPassword(typedPassword, stored.ownerPasswordHash), true, "the password matches");
  assert.equal(isPumpOwnerRole(stored.role), true, "the account is a pump owner");
});

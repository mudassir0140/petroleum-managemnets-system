// Tests for the account controls: which accounts are disabled, and which account types exist. Run with:
// node --test scripts/account-controls.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCOUNT_KINDS, isAccountKind, isDisabledAccount } from "../src/lib/account/controls.ts";

test("only an explicit disabled: true blocks an account", () => {
  assert.equal(isDisabledAccount({ disabled: true }), true);
  assert.equal(isDisabledAccount({ disabled: false }), false);
  assert.equal(isDisabledAccount({}), false, "records saved before the flag existed stay enabled");
  assert.equal(isDisabledAccount({ disabled: "true" }), false, "a string is not a disable");
  assert.equal(isDisabledAccount(null), false);
  assert.equal(isDisabledAccount(undefined), false);
});

test("only the four account types can be managed", () => {
  for (const kind of ["supplier", "khata", "employee", "truck"]) assert.equal(isAccountKind(kind), true, kind);
  for (const kind of ["admin", "__proto__", "constructor", "", "Supplier"]) assert.equal(isAccountKind(kind), false, kind);
});

test("each account type points at its own collection", () => {
  assert.equal(ACCOUNT_KINDS.supplier.collection, "supplierAccounts");
  assert.equal(ACCOUNT_KINDS.khata.collection, "khataClients");
  assert.equal(ACCOUNT_KINDS.employee.collection, "pump_employees");
  assert.equal(ACCOUNT_KINDS.truck.collection, "trucks");
});

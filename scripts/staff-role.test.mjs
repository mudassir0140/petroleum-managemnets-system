// Tests for the staff role routing rule. Run with: node --test scripts/staff-role.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveStaffRole } from "../src/lib/auth/staff-role.ts";
import { getRoleBySlug, isRoleSlug } from "../src/lib/roles.ts";

const dashboardOf = (saved) => {
  const slug = resolveStaffRole(saved, isRoleSlug);
  return slug ? getRoleBySlug(slug).dashboardHref : null;
};

test("a saved role that is a role slug keeps its own dashboard", () => {
  assert.equal(dashboardOf("pump-attendant"), "/dashboard/attendant");
  assert.equal(dashboardOf("cashier"), "/dashboard/cashier");
});

test("shift manager opens the pump manager dashboard, not the company owner's", () => {
  assert.equal(resolveStaffRole("shift-manager", isRoleSlug), "pump-manager");
  assert.equal(dashboardOf("shift-manager"), "/dashboard/pump-manager");
});

test("a role with no dashboard resolves to null instead of the company owner", () => {
  assert.equal(resolveStaffRole("unknown-role", isRoleSlug), null);
  assert.equal(resolveStaffRole("", isRoleSlug), null);
  assert.equal(resolveStaffRole(undefined, isRoleSlug), null);
  assert.equal(resolveStaffRole(42, isRoleSlug), null);
});

test("the saved role is matched case- and space-insensitively", () => {
  assert.equal(resolveStaffRole("  Shift-Manager ", isRoleSlug), "pump-manager");
  assert.equal(resolveStaffRole("PUMP-ATTENDANT", isRoleSlug), "pump-attendant");
});

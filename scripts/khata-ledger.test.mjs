// Tests for the monthly khata ledger: month boundaries, carry-forward, payments, closing and review.
// Run with: node --test scripts/khata-ledger.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthKeyOf,
  addMonths,
  monthRange,
  toPaisa,
  buildLedger,
  monthsNeedingReview,
  canCloseMonth,
  canRecordIn,
  outstandingSummary,
  reviewNotificationKey,
} from "../src/lib/khata/ledger.ts";

test("month boundaries follow Pakistan time, not UTC", () => {
  // 31 Sep 2026 19:00 UTC is 1 Oct 2026 00:00 in Pakistan.
  assert.equal(monthKeyOf("2026-09-30T19:00:00.000Z"), "2026-10");
  assert.equal(monthKeyOf("2026-09-30T18:59:59.000Z"), "2026-09");
  // A date-only value is that calendar date.
  assert.equal(monthKeyOf("2026-10-01"), "2026-10");
  assert.equal(monthKeyOf("2026-09-30"), "2026-09");
  assert.equal(monthKeyOf("not a date"), "");
});

test("months roll over the year", () => {
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2027-01", -1), "2026-12");
  assert.deepEqual(monthRange("2026-11", "2027-02"), ["2026-11", "2026-12", "2027-01", "2027-02"]);
  assert.deepEqual(monthRange("2026-05", "2026-04"), []);
});

test("paisa conversion is exact and tolerant", () => {
  assert.equal(toPaisa(0.1 + 0.2), 30);
  assert.equal(toPaisa("12.5"), 1250);
  assert.equal(toPaisa(undefined), 0);
  assert.equal(toPaisa("abc"), 0);
});

test("the opening transaction and the month's fuel are summed by date", () => {
  const rows = buildLedger({
    startMonth: "2026-08",
    endMonth: "2026-08",
    fuel: [
      { date: "2026-08-01", amount: 1000 }, // opening transaction
      { date: "2026-08-15T10:00:00.000Z", amount: 250.5 },
    ],
    payments: [],
    closed: new Map(),
  });
  assert.equal(rows[0].fuel, 1250.5);
  assert.equal(rows[0].closing, 1250.5);
});

test("unpaid balance carries forward as the next month's opening balance", () => {
  const rows = buildLedger({
    startMonth: "2026-08",
    endMonth: "2026-10",
    fuel: [{ date: "2026-08-01", amount: 1000 }, { date: "2026-09-10", amount: 500 }],
    payments: [{ date: "2026-09-20", amountReceived: 400, advancePaid: 0 }],
    closed: new Map(),
  });
  assert.deepEqual(rows.map((r) => [r.month, r.opening, r.fuel, r.payments, r.closing]), [
    ["2026-08", 0, 1000, 0, 1000],
    ["2026-09", 1000, 500, 400, 1100],
    ["2026-10", 1100, 0, 0, 1100],
  ]);
});

test("advances reduce the balance like payments do, and are counted once", () => {
  const rows = buildLedger({
    startMonth: "2026-09",
    endMonth: "2026-09",
    fuel: [{ date: "2026-09-01", amount: 300 }],
    payments: [{ date: "2026-09-02", amountReceived: 100, advancePaid: 50 }],
    closed: new Map(),
  });
  assert.equal(rows[0].advances, 50);
  assert.equal(rows[0].closing, 150);
});

test("an overpayment becomes credit that carries forward and is not lost", () => {
  const rows = buildLedger({
    startMonth: "2026-09",
    endMonth: "2026-10",
    fuel: [{ date: "2026-09-01", amount: 200 }],
    payments: [{ date: "2026-09-05", amountReceived: 250, advancePaid: 0 }],
    closed: new Map(),
  });
  assert.equal(rows[0].closing, -50);
  assert.equal(rows[1].opening, -50, "the credit is the next month's opening balance");
  assert.equal(rows[1].status, "paid");
});

test("statuses: pending, partially paid, paid in full, and closed", () => {
  const rows = buildLedger({
    startMonth: "2026-07",
    endMonth: "2026-10",
    fuel: [{ date: "2026-07-01", amount: 100 }, { date: "2026-08-01", amount: 100 }, { date: "2026-09-01", amount: 100 }],
    payments: [{ date: "2026-08-02", amountReceived: 50, advancePaid: 0 }, { date: "2026-09-02", amountReceived: 300, advancePaid: 0 }],
    closed: new Map([["2026-07", { opening: 0, fuel: 100, payments: 0, advances: 0, closing: 100 }]]),
  });
  const byMonth = Object.fromEntries(rows.map((r) => [r.month, r.status]));
  assert.equal(byMonth["2026-07"], "closed");
  assert.equal(byMonth["2026-08"], "partially-paid");
  assert.equal(byMonth["2026-09"], "paid");
});

test("a closed month keeps its frozen figures and flags later changes", () => {
  const closed = new Map([["2026-08", { opening: 0, fuel: 500, payments: 0, advances: 0, closing: 500 }]]);
  const before = buildLedger({ startMonth: "2026-08", endMonth: "2026-08", fuel: [{ date: "2026-08-01", amount: 500 }], payments: [], closed });
  assert.equal(before[0].changedAfterClose, false);
  const after = buildLedger({
    startMonth: "2026-08",
    endMonth: "2026-08",
    fuel: [{ date: "2026-08-01", amount: 500 }],
    payments: [{ date: "2026-08-20", amountReceived: 100, advancePaid: 0 }],
    closed,
  });
  assert.equal(after[0].changedAfterClose, true);
  assert.equal(after[0].closedSnapshot.closing, 500, "the frozen figure is kept as recorded");
  assert.equal(after[0].closing, 400, "the live figure reflects the edit");
});

test("months needing review are the open past months that carry figures", () => {
  const rows = buildLedger({
    startMonth: "2026-07",
    endMonth: "2026-10",
    fuel: [{ date: "2026-07-01", amount: 100 }, { date: "2026-09-01", amount: 0 }],
    payments: [],
    closed: new Map(),
  });
  const due = monthsNeedingReview(rows, "2026-10").map((r) => r.month);
  // July carries 100 into August, and August carries it into September, so all three stay due.
  // The current month is never in the list.
  assert.deepEqual(due, ["2026-07", "2026-08", "2026-09"]);
});

test("a review notification is keyed by pump, account and month, so repeats collapse", () => {
  assert.equal(reviewNotificationKey("p1", "c1", "2026-09"), reviewNotificationKey("p1", "c1", "2026-09"));
  assert.notEqual(reviewNotificationKey("p1", "c1", "2026-09"), reviewNotificationKey("p1", "c1", "2026-10"));
});

test("only a past month can be closed; the current month cannot", () => {
  assert.equal(canCloseMonth("2026-09", "2026-10").ok, true);
  assert.equal(canCloseMonth("2026-10", "2026-10").ok, false);
  assert.equal(canCloseMonth("2026-11", "2026-10").ok, false);
});

test("payments cannot be added to a closed month", () => {
  assert.equal(canRecordIn(undefined).ok, true);
  assert.equal(canRecordIn({ closed: false }).ok, true);
  assert.equal(canRecordIn({ closed: true }).ok, false);
});

test("the outstanding summary separates dues from credit", () => {
  const summary = outstandingSummary([1000.1, -50, 0, 250.2]);
  assert.deepEqual(summary, { outstanding: 1250.3, credit: 50, accountsWithDues: 2 });
});

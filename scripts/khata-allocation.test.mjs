// Tests for payment allocation, month-wise dues and the breakdown. Run with: node --test scripts/khata-allocation.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLedger, allocateOldestFirst, validateManualAllocation, duesBreakdown } from "../src/lib/khata/ledger.ts";

const dues = (rows) => rows.map((r) => ({ month: r.month, remaining: r.remaining }));

test("oldest-first pays the earliest unpaid month before later ones", () => {
  const due = [
    { month: "2026-03", remaining: 1000 },
    { month: "2026-01", remaining: 500 },
    { month: "2026-02", remaining: 0 },
  ];
  const result = allocateOldestFirst(due, 800);
  assert.deepEqual(result.allocations, [
    { month: "2026-01", amount: 500 },
    { month: "2026-03", amount: 300 },
  ]);
  assert.equal(result.unallocated, 0);
});

test("oldest-first keeps any excess as unallocated credit", () => {
  const result = allocateOldestFirst([{ month: "2026-01", remaining: 100 }], 250.5);
  assert.deepEqual(result.allocations, [{ month: "2026-01", amount: 100 }]);
  assert.equal(result.unallocated, 150.5);
});

test("oldest-first with nothing owed makes the whole payment credit", () => {
  const result = allocateOldestFirst([], 90);
  assert.deepEqual(result.allocations, []);
  assert.equal(result.unallocated, 90);
});

test("manual allocation checks each month's dues and the total", () => {
  const due = [{ month: "2026-01", remaining: 300 }, { month: "2026-02", remaining: 200 }];
  assert.deepEqual(validateManualAllocation(due, [{ month: "2026-02", amount: 150 }], 200), { ok: true, unallocated: 50 });
  assert.equal(validateManualAllocation(due, [{ month: "2026-02", amount: 250 }], 300).ok, false, "more than the month owes");
  assert.equal(validateManualAllocation(due, [{ month: "2026-05", amount: 10 }], 10).ok, false, "a month with no dues");
  assert.equal(validateManualAllocation(due, [{ month: "2026-01", amount: 200 }, { month: "2026-02", amount: 100 }], 250).ok, false, "more than the payment");
  assert.equal(validateManualAllocation(due, [{ month: "2026-01", amount: 0 }], 10).ok, false, "zero is not an allocation");
  // The same month twice counts together against what it owes.
  assert.equal(validateManualAllocation(due, [{ month: "2026-01", amount: 200 }, { month: "2026-01", amount: 200 }], 400).ok, false);
});

test("each month keeps its own dues and the payments allocated to it", () => {
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-03",
    fuel: [
      { date: "2026-01-01", amount: 1000 },
      { date: "2026-02-01", amount: 500 },
      { date: "2026-03-01", amount: 300 },
    ],
    payments: [{ date: "2026-03-05", amountReceived: 1200, advancePaid: 0, allocations: [{ month: "2026-01", amount: 1000 }, { month: "2026-02", amount: 200 }] }],
    closed: new Map(),
  });
  assert.deepEqual(rows.map((r) => [r.month, r.fuel, r.payments, r.remaining]), [
    ["2026-01", 1000, 1000, 0],
    ["2026-02", 500, 200, 300],
    ["2026-03", 300, 0, 300],
  ]);
  assert.equal(rows[0].status, "paid");
  assert.equal(rows[1].status, "partially-paid");
  assert.equal(rows[2].status, "pending");
  // February\x27s unpaid 300 carries into March as its opening balance.
  assert.equal(rows[2].opening, 300);
});

test("a payment is counted once: closing equals dues minus everything paid", () => {
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-04",
    fuel: [{ date: "2026-01-01", amount: 700 }, { date: "2026-02-01", amount: 400 }],
    payments: [
      { date: "2026-02-10", amountReceived: 500, advancePaid: 0, allocations: [{ month: "2026-01", amount: 500 }] },
      { date: "2026-03-10", amountReceived: 300, advancePaid: 50, allocations: [{ month: "2026-02", amount: 200 }] },
    ],
    closed: new Map(),
  });
  const last = rows[rows.length - 1];
  // Dues 1,100; allocated 500 + 200 = 700; credit from the March payment (350 − 200 = 150).
  assert.equal(last.closing, 1100 - 700 - 150);
  const breakdown = duesBreakdown(rows);
  assert.equal(breakdown.grossOutstanding, 400, "February still owes 200 and January is paid; March has no dues");
  assert.equal(breakdown.netBalance, last.closing);
});

test("the breakdown lists every unpaid month separately, with totals", () => {
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-03",
    fuel: [{ date: "2026-01-01", amount: 1000 }, { date: "2026-02-01", amount: 500 }, { date: "2026-03-01", amount: 0 }],
    payments: [{ date: "2026-02-15", amountReceived: 300, advancePaid: 0, allocations: [{ month: "2026-01", amount: 300 }] }],
    closed: new Map(),
  });
  const breakdown = duesBreakdown(rows);
  assert.deepEqual(breakdown.months.map((m) => [m.month, m.originalDues, m.paymentsReceived, m.remaining, m.status]), [
    ["2026-01", 1000, 300, 700, "partially-paid"],
    ["2026-02", 500, 0, 500, "pending"],
  ]);
  assert.equal(breakdown.grossOutstanding, 1200);
  assert.equal(breakdown.unallocatedCredit, 0);
  assert.equal(breakdown.netBalance, 1200);
});

test("credit from a payment stays visible and is never merged into a month", () => {
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-02",
    fuel: [{ date: "2026-01-01", amount: 100 }],
    payments: [{ date: "2026-02-03", amountReceived: 150, advancePaid: 0, allocations: [{ month: "2026-01", amount: 100 }] }],
    closed: new Map(),
  });
  assert.equal(rows[1].credit, 50, "the 50 is credit in February, shown on its own");
  assert.equal(rows[1].remaining, 0);
  const breakdown = duesBreakdown(rows);
  assert.equal(breakdown.grossOutstanding, 0);
  assert.equal(breakdown.unallocatedCredit, 50);
  assert.equal(breakdown.netBalance, -50);
});

test("legacy payments without allocations are applied to their own month, with the rest as credit", () => {
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-02",
    fuel: [{ date: "2026-01-01", amount: 400 }, { date: "2026-02-01", amount: 100 }],
    payments: [{ date: "2026-02-20", amountReceived: 250, advancePaid: 0 }],
    closed: new Map(),
  });
  assert.equal(rows[1].payments, 100, "February\x27s own dues are paid up to what it owes");
  assert.equal(rows[1].credit, 150);
  assert.equal(rows[0].remaining, 400, "January is not touched by a February payment");
});

test("an allocation to a closed month still reduces that month\x27s unpaid amount", () => {
  const closed = new Map([["2026-01", { opening: 0, fuel: 500, payments: 0, advances: 0, closing: 500 }]]);
  const rows = buildLedger({
    startMonth: "2026-01",
    endMonth: "2026-02",
    fuel: [{ date: "2026-01-01", amount: 500 }],
    payments: [{ date: "2026-02-02", amountReceived: 200, advancePaid: 0, allocations: [{ month: "2026-01", amount: 200 }] }],
    closed,
  });
  assert.equal(rows[0].status, "closed");
  assert.equal(rows[0].remaining, 300);
  assert.equal(rows[0].changedAfterClose, true, "the closed month\x27s figures moved since closing, so this is flagged");
});

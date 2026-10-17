import { ObjectId, type Document } from "mongodb";
import type { PaymentMethod } from "./payments";
import { isCounted } from "./payments";
import { getDatabase } from "@/lib/db/mongodb";
import {
  allocateOldestFirst,
  buildLedger,
  canCloseMonth,
  duesBreakdown,
  validateManualAllocation,
  type PaymentAllocation,
  canRecordIn,
  monthKeyOf,
  monthsNeedingReview,
  reviewNotificationKey,
  toPaisa,
  fromPaisa,
  type ClosedSnapshot,
  type LedgerFuelLine,
  type LedgerPayment,
  type MonthRow,
} from "./ledger";

// The monthly khata on top of the existing collections:
//   khataClients   the account (name, opening transaction, rates)
//   khataEntries   fuel given (dated)
//   khataPayments  payments and advances (dated, with method and note)
//   khataMonths    closed months only, with the figures frozen at closing
//   khataMonthEdits the audit history of every change
//   notifications  the review reminders for the pump owner
// Balances are computed from the dated records. Nothing here stores a running total that could drift.


const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function todayPakistan(now: Date): string {
  return new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

// Closed months written before snapshots existed keep their old field names.
function snapshotOf(doc: Document): ClosedSnapshot {
  if (doc.closedSnapshot) {
    const s = doc.closedSnapshot as ClosedSnapshot;
    return { opening: num(s.opening), fuel: num(s.fuel), payments: num(s.payments), advances: num(s.advances), closing: num(s.closing) };
  }
  return {
    opening: num(doc.openingBalance),
    fuel: num(doc.totalFuel),
    payments: num(doc.paid),
    advances: num(doc.advance),
    closing: num(doc.remaining),
  };
}

export interface AccountLedger {
  clientId: string;
  clientName: string;
  department: string;
  // The opening transaction: its date (YYYY-MM-DD) and amount.
  openingDate: string;
  openingAmount: number;
  username: string;
  rows: MonthRow[];
  // Latest month in the ledger: the last row's closing balance is the account's balance today.
  balance: number;
  // Month-wise dues: every unpaid month on its own line, with the totals.
  breakdown: ReturnType<typeof duesBreakdown>;
  totalFuel: number;
  totalPaid: number;
  totalAdvances: number;
  payments: Array<{ _id: string; amountReceived: number; advancePaid: number; method: string; date: string; note: string; recordedBy: string; createdAt: string; allocationMode: string; allocations: PaymentAllocation[] | null; unallocated: number; status: string; txnId: string; source: string; details: Record<string, string>; attachmentId: string; verifiedBy: string; verifiedAt: string; statusHistory: unknown[] }>;
  entries: Array<{ _id: string; date: string; amount: number; fuelType: string; litres: number; vehicleNumber: string; driverName: string; attendantName: string; givenRate: number }>;
}

// Loads the ledgers for a pump's accounts (all of them, or only the given ids), from four queries.
export async function loadAccountLedgers(
  pumpId: ObjectId,
  now: Date,
  clientIds?: ObjectId[],
  options: { excludePaymentId?: string } = {}
): Promise<AccountLedger[]> {
  const db = await getDatabase();
  const scope: Document = clientIds ? { pumpId, khataClientId: { $in: clientIds } } : { pumpId };
  const clientScope: Document = clientIds ? { pumpId, _id: { $in: clientIds } } : { pumpId };

  const [clients, entries, payments, months] = await Promise.all([
    db.collection("khataClients").find(clientScope).toArray(),
    db.collection("khataEntries").find(scope).sort({ date: 1 }).toArray(),
    db.collection("khataPayments").find(scope).sort({ date: 1 }).toArray(),
    db.collection("khataMonths").find({ ...scope, status: "closed" }).toArray(),
  ]);

  const currentMonth = monthKeyOf(now);
  return clients.map((client) => {
    const id = String(client._id);
    const clientEntries = entries.filter((e) => String(e.khataClientId) === id);
    const clientPayments = payments.filter((p) => String(p.khataClientId) === id);
    const closed = new Map<string, ClosedSnapshot>();
    for (const m of months.filter((doc) => String(doc.khataClientId) === id)) {
      closed.set(String(m.month), snapshotOf(m));
    }

    // The opening transaction is a fuel line dated on the account's start date.
    const openingDate = isDateOnly(client.date) ? (client.date as string) : client.createdAt instanceof Date ? client.createdAt : new Date(0);
    const fuel: LedgerFuelLine[] = [
      { date: openingDate as string, amount: num(client.openingAmount) },
      ...clientEntries.map((e) => ({ date: iso(e.date), amount: num(e.amount) })),
    ];
    // The excluded payment is left out of the ledger, so its amount can be allocated again without counting twice.
    // Pending, bounced and excluded payments do not count until they are confirmed.
    const ledgerPayments: LedgerPayment[] = clientPayments.filter((p) => isCounted(p.status) && String(p._id) !== (options.excludePaymentId ?? "")).map((p) => ({
      date: iso(p.date),
      amountReceived: num(p.amountReceived),
      advancePaid: num(p.advancePaid),
      allocations: Array.isArray(p.allocations)
        ? p.allocations.map((a: Document) => ({ month: String(a.month), amount: num(a.amount) }))
        : null,
    }));

    const recordMonths = [
      monthKeyOf(openingDate),
      ...fuel.map((f) => monthKeyOf(f.date)),
      ...ledgerPayments.map((p) => monthKeyOf(p.date)),
      ...ledgerPayments.flatMap((p) => (p.allocations ?? []).map((a) => a.month)),
      ...closed.keys(),
    ]
      .filter((m) => m !== "")
      .sort();
    const startMonth = recordMonths[0] ?? currentMonth;
    const endMonth = [currentMonth, ...recordMonths].sort().at(-1) ?? currentMonth;
    const rows = buildLedger({ startMonth, endMonth, fuel, payments: ledgerPayments, closed });

    const totalFuel = rows.reduce((sum, r) => sum + toPaisa(r.fuel), 0);
    const totalPaid = rows.reduce((sum, r) => sum + toPaisa(r.payments), 0);
    const totalAdvances = rows.reduce((sum, r) => sum + toPaisa(r.advances), 0);
    const balance = rows.length > 0 ? rows[rows.length - 1].closing : 0;

    return {
      clientId: id,
      clientName: String(client.clientName ?? ""),
      department: String(client.department ?? ""),
      openingDate: isDateOnly(client.date) ? String(client.date) : iso(client.createdAt).slice(0, 10),
      openingAmount: num(client.openingAmount),
      username: String(client.username ?? ""),
      rows,
      balance,
      breakdown: duesBreakdown(rows),
      totalFuel: fromPaisa(totalFuel),
      totalPaid: fromPaisa(totalPaid),
      totalAdvances: fromPaisa(totalAdvances),
      payments: clientPayments.map((p) => ({
        _id: String(p._id),
        amountReceived: num(p.amountReceived),
        advancePaid: num(p.advancePaid),
        method: String(p.method ?? ""),
        date: iso(p.date),
        note: String(p.note ?? ""),
        recordedBy: String(p.recordedBy ?? ""),
        createdAt: iso(p.createdAt),
        allocationMode: String(p.allocationMode ?? ""),
        allocations: Array.isArray(p.allocations) ? (p.allocations as PaymentAllocation[]) : null,
        unallocated: num(p.unallocated),
        status: String(p.status ?? "confirmed"),
        txnId: String(p.txnId ?? ""),
        source: String(p.source ?? "owner"),
        details: (p.details ?? {}) as Record<string, string>,
        attachmentId: p.attachmentId ? String(p.attachmentId) : "",
        verifiedBy: String(p.verifiedBy ?? ""),
        verifiedAt: iso(p.verifiedAt),
        statusHistory: Array.isArray(p.statusHistory) ? p.statusHistory : [],
      })),
      entries: clientEntries.map((e) => ({
        _id: String(e._id),
        date: iso(e.date),
        amount: num(e.amount),
        fuelType: String(e.fuelType ?? ""),
        litres: num(e.litres),
        vehicleNumber: String(e.vehicleNumber ?? ""),
        driverName: String(e.driverName ?? ""),
        attendantName: String(e.attendantName ?? ""),
        givenRate: num(e.givenRate),
      })),
    };
  });
}

// Writes the computed totals back onto the account, so the stored fields never disagree with the ledger.
export async function storeTotals(pumpId: ObjectId, ledger: AccountLedger) {
  const db = await getDatabase();
  await db.collection("khataClients").updateOne(
    { _id: new ObjectId(ledger.clientId), pumpId },
    {
      $set: {
        totalFuelAmount: ledger.totalFuel,
        totalPaid: ledger.totalPaid,
        advancePaid: ledger.totalAdvances,
        remainingBalance: ledger.balance,
        updatedAt: new Date(),
      },
    }
  );
}

export async function audit(entry: Document) {
  const db = await getDatabase();
  await db.collection("khataMonthEdits").insertOne({ ...entry, editedAt: new Date() });
}

export type ServiceError = { ok: false; status: number; error: string; code?: string };

// Edits a payment. Fields that change are recorded one by one, with who and when. A payment in a
// closed month (before or after the change) needs the owner's explicit confirmation.
export async function editPayment(
  pumpId: ObjectId,
  paymentId: ObjectId,
  changes: Partial<{ amountReceived: number; advancePaid: number; method: PaymentMethod; date: string; note: string }>,
  options: { confirmed: boolean; editedBy: string; reason: string },
  now: Date
): Promise<ServiceError | { ok: true; changedFields: string[] }> {
  const db = await getDatabase();
  const payment = await db.collection("khataPayments").findOne({ _id: paymentId, pumpId });
  if (!payment) return { ok: false, status: 404, error: "Payment not found" };

  const clientId = payment.khataClientId as ObjectId;
  const oldMonth = monthKeyOf(iso(payment.date));
  const newDate = changes.date ?? iso(payment.date);
  if (!isDateOnly(newDate)) return { ok: false, status: 400, error: "Enter a valid payment date" };
  const newMonth = monthKeyOf(newDate);
  const currentMonth = monthKeyOf(now);
  if (newMonth > currentMonth) return { ok: false, status: 400, error: "A payment cannot be dated in a future month" };

  const [ledger] = await loadAccountLedgers(pumpId, now, [clientId]);
  const oldRow = ledger?.rows.find((r) => r.month === oldMonth);
  const newRow = ledger?.rows.find((r) => r.month === newMonth);
  const touchesClosed = Boolean(oldRow?.closed || newRow?.closed);
  if (touchesClosed && !options.confirmed) {
    return {
      ok: false,
      status: 409,
      code: "confirmation-required",
      error: `This change is in a closed month (${oldRow?.closed ? oldMonth : newMonth}). Confirm it to save.`,
    };
  }

  const update: Document = {};
  const log: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  const fields: Array<keyof typeof changes> = ["amountReceived", "advancePaid", "method", "date", "note"];
  for (const field of fields) {
    if (changes[field] === undefined) continue;
    const oldValue = field === "date" ? iso(payment.date) : payment[field];
    if (oldValue !== changes[field]) {
      log.push({ field, oldValue, newValue: changes[field] });
      update[field] = changes[field];
    }
  }
  if (log.length === 0) return { ok: true, changedFields: [] };

  const amount = num(update.amountReceived ?? payment.amountReceived) + num(update.advancePaid ?? payment.advancePaid);
  if (amount <= 0) return { ok: false, status: 400, error: "Enter an amount greater than 0" };

  if (payment.allocationMode && isCounted(payment.status) && (changes.amountReceived !== undefined || changes.advancePaid !== undefined)) {
    const newTotal = num(update.amountReceived ?? payment.amountReceived) + num(update.advancePaid ?? payment.advancePaid);
    // The payment's own old allocation is left out, so the dues it can use are the true open dues.
    const [without] = await loadAccountLedgers(pumpId, now, [clientId], { excludePaymentId: String(paymentId) });
    const dues = (without?.rows ?? []).filter((r) => r.remaining > 0).map((r) => ({ month: r.month, remaining: r.remaining }));
    if (payment.allocationMode === "oldest-first") {
      const result = allocateOldestFirst(dues, newTotal);
      update.allocations = result.allocations;
      update.unallocated = result.unallocated;
      log.push({ field: "allocations", oldValue: payment.allocations ?? [], newValue: result.allocations });
    } else {
      const check = validateManualAllocation(dues, (payment.allocations ?? []) as PaymentAllocation[], newTotal);
      if (!check.ok) return { ok: false, status: 409, error: `${check.error}. Change the allocation first.` };
      update.unallocated = check.unallocated;
    }
  }

  await db.collection("khataPayments").updateOne({ _id: paymentId, pumpId }, { $set: { ...update, updatedAt: now } });
  for (const change of log) {
    await audit({
      type: "payment-edited",
      pumpId,
      khataClientId: clientId,
      paymentId,
      month: oldMonth,
      monthWasClosed: Boolean(oldRow?.closed),
      field: change.field,
      oldValue: change.oldValue instanceof Date ? change.oldValue.toISOString() : change.oldValue,
      newValue: change.newValue,
      reason: options.reason,
      editedBy: options.editedBy,
      confirmed: options.confirmed,
    });
  }

  const [fresh] = await loadAccountLedgers(pumpId, now, [clientId]);
  if (fresh) await storeTotals(pumpId, fresh);
  return { ok: true, changedFields: log.map((l) => l.field) };
}

// Closes a month for one account. Only a month that is over can be closed, and only once.
// The figures are frozen in khataMonths, and the owner must confirm the exact closing balance they reviewed.
export async function closeMonth(
  pumpId: ObjectId,
  clientId: ObjectId,
  month: string,
  options: { confirmed: boolean; expectedClosing: number; closedBy: string },
  now: Date
): Promise<ServiceError | { ok: true; row: MonthRow }> {
  if (!options.confirmed) return { ok: false, status: 400, error: "Confirm the close before the month is closed" };
  const currentMonth = monthKeyOf(now);
  const allowed = canCloseMonth(month, currentMonth);
  if (!allowed.ok) return { ok: false, status: 409, error: allowed.error };

  const [ledger] = await loadAccountLedgers(pumpId, now, [clientId]);
  if (!ledger) return { ok: false, status: 404, error: "Khata not found" };
  const row = ledger.rows.find((r) => r.month === month);
  if (!row) return { ok: false, status: 404, error: "Month not found" };
  if (row.closed) return { ok: false, status: 409, error: "This month is already closed", code: "already-closed" };
  if (toPaisa(row.closing) !== toPaisa(options.expectedClosing)) {
    return {
      ok: false,
      status: 409,
      code: "figures-changed",
      error: `The closing balance is now ${row.closing.toFixed(2)}, not ${Number(options.expectedClosing).toFixed(2)}. Review it again before closing.`,
    };
  }

  const db = await getDatabase();
  const snapshot: ClosedSnapshot = {
    opening: row.opening,
    fuel: row.fuel,
    payments: row.payments,
    advances: row.advances,
    closing: row.closing,
  };
  // A legacy open record for this month is converted in place; an existing closed record blocks the close.
  const existing = await db.collection("khataMonths").findOne({ khataClientId: clientId, pumpId, month, status: "closed" });
  if (existing) return { ok: false, status: 409, error: "This month is already closed", code: "already-closed" };
  await db.collection("khataMonths").updateOne(
    { khataClientId: clientId, pumpId, month, status: { $ne: "closed" } },
    {
      $set: {
        status: "closed",
        closedSnapshot: snapshot,
        // Legacy names, so the existing client portal keeps reading the same figures.
        openingBalance: snapshot.opening,
        totalFuel: snapshot.fuel,
        paid: snapshot.payments,
        advance: snapshot.advances,
        remaining: snapshot.closing,
        closedBy: options.closedBy,
        closedAt: now,
        updatedAt: now,
      },
      $setOnInsert: { khataClientId: clientId, pumpId, month, createdAt: now },
    },
    { upsert: true }
  );

  await audit({
    type: "month-closed",
    pumpId,
    khataClientId: clientId,
    month,
    changes: [],
    after: snapshot,
    editedBy: options.closedBy,
  });
  return { ok: true, row: { ...row, closed: true, status: "closed", closedSnapshot: snapshot, changedAfterClose: false } };
}

// Creates one review notification per account and overdue month. The dedupe key means a repeat check
// (every login, every bell refresh) never makes a second copy.
export async function ensureReviewNotifications(pumpId: ObjectId, now: Date): Promise<number> {
  const ledgers = await loadAccountLedgers(pumpId, now);
  const currentMonth = monthKeyOf(now);
  const db = await getDatabase();
  const collection = db.collection("notifications");
  let created = 0;

  for (const ledger of ledgers) {
    for (const row of monthsNeedingReview(ledger.rows, currentMonth)) {
      const dedupeKey = reviewNotificationKey(String(pumpId), ledger.clientId, row.month);
      const result = await collection.updateOne(
        { dedupeKey },
        {
          $setOnInsert: {
            dedupeKey,
            recipientId: pumpId,
            recipientType: "pump-owner",
            pumpId,
            type: "khata-review",
            khataClientId: new ObjectId(ledger.clientId),
            month: row.month,
            href: `/pumpadmin/khata/${ledger.clientId}?month=${row.month}`,
            title: "Review and close khata / کھاتہ جائزہ اور بند کریں",
            message: `${ledger.clientName}: review and close the ${row.month} khata. Opening ${row.opening.toFixed(2)}, fuel ${row.fuel.toFixed(2)}, payments ${row.payments.toFixed(2)}, advances ${row.advances.toFixed(2)}, closing ${row.closing.toFixed(2)} PKR.`,
            data: { ...row, clientName: ledger.clientName },
            read: false,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount === 1) created += 1;
    }
  }
  return created;
}

export async function listAudit(pumpId: ObjectId, clientId: ObjectId, limit = 200) {
  const db = await getDatabase();
  const rows = await db
    .collection("khataMonthEdits")
    .find({ pumpId, khataClientId: clientId })
    .sort({ editedAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map((r) => ({
    _id: String(r._id),
    type: String(r.type ?? "edit"),
    month: String(r.month ?? ""),
    field: String(r.field ?? ""),
    oldValue: r.oldValue ?? null,
    newValue: r.newValue ?? null,
    reason: String(r.reason ?? ""),
    monthWasClosed: Boolean(r.monthWasClosed),
    editedBy: String(r.editedBy ?? ""),
    editedAt: iso(r.editedAt),
    after: r.after ?? null,
  }));
}

import crypto from "crypto";
import { Binary, ObjectId, type Db, type Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { audit, isDateOnly, loadAccountLedgers, storeTotals, type AccountLedger, type ServiceError } from "./monthly";
import { allocateOldestFirst, canRecordIn, monthKeyOf, validateManualAllocation, type MonthRow, type PaymentAllocation } from "./ledger";
import {
  initialStatus,
  isCounted,
  isPaymentMethod,
  referenceKey,
  runningBalances,
  STATUS_LABELS,
  transitionAllowed,
  validateMethodDetails,
  validateProof,
  type BalanceEvent,
  type MethodDetails,
  type PaymentMethod,
  type PaymentStatus,
} from "./payments";

// Every payment is a permanent record in khataPayments with its own transaction ID. Nothing is deleted.
// Confirmed payments count towards dues and balances. Pending and bounced ones are shown separately.
export const PAYMENTS = "khataPayments";
export const ATTACHMENTS = "khataAttachments";
const NOTIFICATIONS = "notifications";

let indexesReady = false;

// Unique keys: a transaction ID is never reused, and a client's submission is stored once.
async function ensureIndexes(db: Db) {
  if (indexesReady) return;
  await db.collection(PAYMENTS).createIndex({ txnId: 1 }, { unique: true, partialFilterExpression: { txnId: { $type: "string" } } });
  await db
    .collection(PAYMENTS)
    .createIndex({ khataClientId: 1, clientRequestId: 1 }, { unique: true, partialFilterExpression: { clientRequestId: { $type: "string" } } });
  await db.collection(ATTACHMENTS).createIndex({ paymentId: 1 });
  indexesReady = true;
}

function newTxnId(now: Date): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `KTX-${day}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function pktDay(value: unknown): string {
  if (typeof value === "string" && isDateOnly(value)) return value;
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  if (!Number.isFinite(time)) return "";
  return new Date(time + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dues(ledger: AccountLedger) {
  return ledger.rows.filter((r) => r.remaining > 0).map((r) => ({ month: r.month, remaining: r.remaining }));
}

export interface TransactionInput {
  method: string;
  amountReceived: number;
  advancePaid: number;
  date: string;
  note: string;
  details: Record<string, unknown>;
  allocationMode: "oldest-first" | "month";
  allocations: PaymentAllocation[];
}

// Records a payment. The owner enters it, or a client submits it through their dashboard.
export async function createTransaction(
  pumpId: ObjectId,
  clientId: ObjectId,
  input: TransactionInput,
  options: { source: "owner" | "client"; actor: string; ownerVerified: boolean; clientRequestId?: string },
  now: Date
): Promise<ServiceError | { ok: true; paymentId: string; txnId: string; status: PaymentStatus; duplicate: boolean; allocations: PaymentAllocation[]; unallocated: number }> {
  const db = await getDatabase();
  await ensureIndexes(db);

  if (!isPaymentMethod(input.method)) return { ok: false, status: 400, error: "Choose a payment method" };
  const method: PaymentMethod = input.method;
  const fields = validateMethodDetails(method, { ...input.details, amount: input.amountReceived, date: input.date });
  if (!fields.ok) return { ok: false, status: 400, error: fields.error };
  const details: MethodDetails = fields.value;
  if (input.advancePaid < 0) return { ok: false, status: 400, error: "The advance cannot be negative" };
  const total = details.amount + input.advancePaid;

  // A repeat of the same client submission returns the record that already exists.
  if (options.clientRequestId) {
    const existing = await db.collection(PAYMENTS).findOne({ khataClientId: clientId, clientRequestId: options.clientRequestId });
    if (existing) {
      return {
        ok: true,
        paymentId: String(existing._id),
        txnId: String(existing.txnId),
        status: (existing.status ?? "confirmed") as PaymentStatus,
        duplicate: true,
        allocations: (existing.allocations ?? []) as PaymentAllocation[],
        unallocated: Number(existing.unallocated ?? 0),
      };
    }
  }

  const [ledger] = await loadAccountLedgers(pumpId, now, [clientId]);
  if (!ledger) return { ok: false, status: 404, error: "Khata not found" };
  const open = canRecordIn(ledger.rows.find((r) => r.month === monthKeyOf(details.date)));
  if (!open.ok) return { ok: false, status: 409, error: open.error, code: "month-closed" };

  // The same cheque or transfer is never recorded twice.
  const key = referenceKey(method, details);
  if (key) {
    const dup = await db.collection(PAYMENTS).findOne({ pumpId, referenceKey: key, status: { $ne: "bounced" } }, { projection: { _id: 1 } });
    if (dup) return { ok: false, status: 409, error: "This cheque or transfer is already recorded", code: "duplicate" };
  }

  const status = initialStatus(method, options.source, options.ownerVerified);
  const dueList = dues(ledger);
  let allocations: PaymentAllocation[] = [];
  let unallocated = 0;
  let requested: PaymentAllocation[] | null = null;
  if (input.allocationMode === "month") {
    const check = validateManualAllocation(dueList, input.allocations, total);
    if (!check.ok) return { ok: false, status: 400, error: check.error };
    requested = input.allocations.filter((a) => a.amount > 0);
    if (status === "confirmed") {
      allocations = requested;
      unallocated = check.unallocated;
    }
  } else if (status === "confirmed") {
    const result = allocateOldestFirst(dueList, total);
    allocations = result.allocations;
    unallocated = result.unallocated;
  }

  const txnId = newTxnId(now);
  const doc: Document = {
    pumpId,
    khataClientId: clientId,
    txnId,
    method,
    amountReceived: details.amount,
    advancePaid: input.advancePaid,
    date: details.date,
    note: input.note,
    status,
    source: options.source,
    referenceKey: key,
    details: Object.fromEntries(Object.entries(details).filter(([k]) => !["amount", "date"].includes(k))),
    allocationMode: input.allocationMode,
    allocations: status === "confirmed" ? allocations : undefined,
    requestedAllocations: requested,
    unallocated: status === "confirmed" ? unallocated : undefined,
    recordedBy: options.actor,
    submittedBy: options.source === "client" ? "client" : "owner",
    verifiedBy: status === "confirmed" ? options.actor : undefined,
    verifiedAt: status === "confirmed" ? now : undefined,
    statusHistory: [{ from: null, to: status, by: options.actor, at: now, reason: options.source === "client" ? "submitted by client" : "entered" }],
    clientRequestId: options.clientRequestId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection(PAYMENTS).insertOne(doc);

  await audit({
    type: "payment-recorded",
    pumpId,
    khataClientId: clientId,
    paymentId: result.insertedId,
    txnId,
    month: monthKeyOf(details.date),
    changes: [],
    after: { method, status, amount: details.amount, advance: input.advancePaid, allocationMode: input.allocationMode, allocations: status === "confirmed" ? allocations : requested, unallocated },
    editedBy: options.actor,
  });

  if (status === "confirmed") {
    const [fresh] = await loadAccountLedgers(pumpId, now, [clientId]);
    if (fresh) await storeTotals(pumpId, fresh);
  }
  if (options.source === "client") {
    await notifyOwner(db, pumpId, clientId, String(result.insertedId), txnId, method, details.amount, ledger.clientName, now);
  }
  return { ok: true, paymentId: String(result.insertedId), txnId, status, duplicate: false, allocations, unallocated };
}

// The owner is told about every client submission, once.
async function notifyOwner(db: Db, pumpId: ObjectId, clientId: ObjectId, paymentId: string, txnId: string, method: string, amount: number, clientName: string, now: Date) {
  const dedupeKey = `khata-payment-submitted:${paymentId}`;
  const label = method === "cheque" ? "cheque" : method === "bank-transfer" ? "bank transfer" : method === "mobile-wallet" ? "mobile wallet payment" : "cash payment";
  await db.collection(NOTIFICATIONS).updateOne(
    { dedupeKey },
    {
      $setOnInsert: {
        dedupeKey,
        recipientId: pumpId,
        recipientType: "pump-owner",
        pumpId,
        type: "khata-payment-submitted",
        khataClientId: clientId,
        paymentId: new ObjectId(paymentId),
        href: `/pumpadmin/khata/${String(clientId)}?payment=${paymentId}`,
        title: "Client submitted a payment / کلائنٹ نے ادائیگی بھیجی",
        message: `${clientName} submitted a ${label} of ${amount.toFixed(2)} PKR (${txnId}). Check and verify it in the khata.`,
        data: { txnId, method, amount, clientName },
        read: false,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
}

// Changes a payment's status. A pending payment is allocated to dues when it is confirmed.
export async function setPaymentStatus(
  pumpId: ObjectId,
  paymentId: ObjectId,
  to: PaymentStatus,
  options: { actor: string; reason: string },
  now: Date
): Promise<ServiceError | { ok: true; status: PaymentStatus; allocations: PaymentAllocation[] }> {
  const db = await getDatabase();
  const payment = await db.collection(PAYMENTS).findOne({ _id: paymentId, pumpId });
  if (!payment) return { ok: false, status: 404, error: "Payment not found" };
  const from = (payment.status ?? "confirmed") as PaymentStatus;
  const method = String(payment.method);
  const step = transitionAllowed(method, from, to);
  if (!step.ok) return { ok: false, status: 409, error: step.error };
  if (!options.reason.trim()) return { ok: false, status: 400, error: "Give a reason for the status change" };

  const update: Document = { status: to, updatedAt: now };
  let allocations: PaymentAllocation[] = (payment.allocations ?? []) as PaymentAllocation[];

  if (to === "confirmed") {
    const total = Number(payment.amountReceived ?? 0) + Number(payment.advancePaid ?? 0);
    const [ledger] = await loadAccountLedgers(pumpId, now, [new ObjectId(payment.khataClientId)]);
    if (!ledger) return { ok: false, status: 404, error: "Khata not found" };
    const dueList = dues(ledger);
    if (payment.allocationMode === "month") {
      const requested = (payment.requestedAllocations ?? []) as PaymentAllocation[];
      const check = validateManualAllocation(dueList, requested, total);
      if (!check.ok) return { ok: false, status: 409, error: `${check.error}. Change the allocation before confirming.` };
      allocations = requested;
      update.unallocated = check.unallocated;
    } else {
      const result = allocateOldestFirst(dueList, total);
      allocations = result.allocations;
      update.unallocated = result.unallocated;
    }
    update.allocations = allocations;
    update.verifiedBy = options.actor;
    update.verifiedAt = now;
  }

  const history = { from, to, by: options.actor, at: now, reason: options.reason.trim() };
  const result = await db.collection(PAYMENTS).updateOne({ _id: paymentId, pumpId, status: payment.status ?? "confirmed" }, { $set: update, $push: { statusHistory: history } } as unknown as Document);
  if (result.modifiedCount === 0) return { ok: false, status: 409, error: "This payment was already changed. Reload and try again." };

  await audit({
    type: "status-changed",
    pumpId,
    khataClientId: payment.khataClientId,
    paymentId,
    txnId: payment.txnId,
    month: monthKeyOf(String(payment.date)),
    field: "status",
    oldValue: from,
    newValue: to,
    reason: options.reason.trim(),
    changes: [],
    editedBy: options.actor,
  });

  const [fresh] = await loadAccountLedgers(pumpId, now, [new ObjectId(payment.khataClientId)]);
  if (fresh) await storeTotals(pumpId, fresh);
  return { ok: true, status: to, allocations };
}

// Stores a proof image for one payment. The bytes are checked, then kept in khataAttachments (never deleted).
export async function attachProof(
  scope: { pumpId: ObjectId; khataClientId?: ObjectId },
  paymentId: ObjectId,
  bytes: Uint8Array,
  uploadedBy: string,
  now: Date,
  clientRequestId?: string | null
): Promise<ServiceError | { ok: true; attachmentId: string }> {
  const check = validateProof(bytes);
  if (!check.ok) return { ok: false, status: 400, error: check.error };
  const db = await getDatabase();
  const filter: Document = { _id: paymentId, pumpId: scope.pumpId, ...(scope.khataClientId ? { khataClientId: scope.khataClientId } : {}) };
  const payment = await db.collection(PAYMENTS).findOne(filter);
  if (!payment) return { ok: false, status: 404, error: "Payment not found" };

  // A repeat with the same key (a queued upload sent again) returns the image already saved for it.
  if (clientRequestId) {
    await db.collection(ATTACHMENTS).createIndex({ paymentId: 1, clientRequestId: 1 }, { unique: true, partialFilterExpression: { clientRequestId: { $type: "string" } } });
    const existing = await db.collection(ATTACHMENTS).findOne({ paymentId, clientRequestId });
    if (existing) {
      await db.collection(PAYMENTS).updateOne(filter, { $set: { attachmentId: existing._id, updatedAt: now } });
      return { ok: true, attachmentId: String(existing._id) };
    }
  }

  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const inserted = await db.collection(ATTACHMENTS).insertOne({
    pumpId: scope.pumpId,
    khataClientId: payment.khataClientId,
    paymentId,
    mime: check.mime,
    size: bytes.length,
    sha256,
    data: new Binary(Buffer.from(bytes)),
    uploadedBy,
    createdAt: now,
    ...(clientRequestId ? { clientRequestId } : {}),
  });
  await db.collection(PAYMENTS).updateOne(filter, { $set: { attachmentId: inserted.insertedId, updatedAt: now } });
  await audit({
    type: "proof-attached",
    pumpId: scope.pumpId,
    khataClientId: payment.khataClientId,
    paymentId,
    txnId: payment.txnId,
    month: monthKeyOf(String(payment.date)),
    changes: [],
    after: { attachmentId: String(inserted.insertedId), sha256, size: bytes.length, mime: check.mime },
    editedBy: uploadedBy,
  });
  return { ok: true, attachmentId: String(inserted.insertedId) };
}

export async function getAttachment(scope: { pumpId: ObjectId; khataClientId?: ObjectId }, attachmentId: ObjectId) {
  const db = await getDatabase();
  return db.collection(ATTACHMENTS).findOne({ _id: attachmentId, pumpId: scope.pumpId, ...(scope.khataClientId ? { khataClientId: scope.khataClientId } : {}) });
}

export interface TransactionRow {
  id: string;
  txnId: string;
  kind: "fuel" | "payment";
  date: string;
  khataClientId: string;
  clientName: string;
  method: string;
  status: PaymentStatus | "fuel";
  statusLabel: string;
  amount: number;
  advance: number;
  reference: string;
  bankAccount: string;
  bankName: string;
  walletProvider: string;
  chequeDate: string;
  note: string;
  attachmentId: string;
  recordedBy: string;
  verifiedBy: string;
  verifiedAt: string;
  source: string;
  remainingBalance: number | null;
}

// Every transaction of the pump, newest first: fuel lines and payments of every status, with the khata balance
// after each counted transaction.
export async function listTransactions(pumpId: ObjectId, now: Date, filter: { month?: string; from?: string; to?: string; method?: string; khataClientId?: string } = {}): Promise<TransactionRow[]> {
  const ledgers = await loadAccountLedgers(pumpId, now, filter.khataClientId && ObjectId.isValid(filter.khataClientId) ? [new ObjectId(filter.khataClientId)] : undefined);
  const rows: TransactionRow[] = [];
  for (const ledger of ledgers) {
    const events: BalanceEvent[] = [{ id: `open:${ledger.clientId}`, at: ledger.openingDate, kind: "fuel", amount: ledger.openingAmount }];
    for (const e of ledger.entries) events.push({ id: `fuel:${e._id}`, at: pktDay(e.date), kind: "fuel", amount: e.amount });
    for (const p of ledger.payments) {
      if (isCounted(p.status)) events.push({ id: `pay:${p._id}`, at: pktDay(p.date), kind: "payment", amount: p.amountReceived + p.advancePaid });
    }
    const balances = runningBalances(events);

    rows.push({
      id: `open:${ledger.clientId}`,
      txnId: "",
      kind: "fuel",
      date: ledger.openingDate,
      khataClientId: ledger.clientId,
      clientName: ledger.clientName,
      method: "fuel",
      status: "fuel",
      statusLabel: "Opening transaction",
      amount: ledger.openingAmount,
      advance: 0,
      reference: "",
      bankAccount: "",
      bankName: "",
      walletProvider: "",
      chequeDate: "",
      note: "",
      attachmentId: "",
      recordedBy: "",
      verifiedBy: "",
      verifiedAt: "",
      source: "owner",
      remainingBalance: balances.get(`open:${ledger.clientId}`) ?? null,
    });
    for (const e of ledger.entries) {
      rows.push({
        id: `fuel:${e._id}`,
        txnId: "",
        kind: "fuel",
        date: pktDay(e.date),
        khataClientId: ledger.clientId,
        clientName: ledger.clientName,
        method: "fuel",
        status: "fuel",
        statusLabel: `Fuel ${e.fuelType} ${e.litres}L`,
        amount: e.amount,
        advance: 0,
        reference: e.vehicleNumber,
        bankAccount: "",
        bankName: "",
        walletProvider: "",
        chequeDate: "",
        note: "",
        attachmentId: "",
        recordedBy: e.attendantName,
        verifiedBy: "",
        verifiedAt: "",
        source: "owner",
        remainingBalance: balances.get(`fuel:${e._id}`) ?? null,
      });
    }
    for (const p of ledger.payments) {
      const status = (isCounted(p.status) ? "confirmed" : p.status) as PaymentStatus;
      const d = p.details ?? {};
      const reference = p.method === "cheque" ? d.chequeNumber ?? "" : p.method === "mobile-wallet" || p.method === "bank-transfer" ? d.transactionId ?? "" : "";
      const legacy = !["cash", "cheque", "bank-transfer", "mobile-wallet"].includes(p.method);
      rows.push({
        id: `pay:${p._id}`,
        txnId: p.txnId,
        kind: "payment",
        date: pktDay(p.date),
        khataClientId: ledger.clientId,
        clientName: ledger.clientName,
        method: legacy ? p.method || "cash" : p.method,
        status,
        statusLabel: STATUS_LABELS[status].en,
        amount: p.amountReceived,
        advance: p.advancePaid,
        reference,
        bankAccount: d.bankAccount ?? "",
        bankName: d.bankName ?? "",
        walletProvider: d.walletProvider ?? "",
        chequeDate: d.chequeDate ?? "",
        note: p.note,
        attachmentId: p.attachmentId,
        recordedBy: p.recordedBy,
        verifiedBy: p.verifiedBy,
        verifiedAt: p.verifiedAt,
        source: p.source,
        remainingBalance: balances.get(`pay:${p._id}`) ?? null,
      });
    }
  }

  return rows
    .filter((r) => (!filter.method || r.method === filter.method) && (!filter.month || r.date.slice(0, 7) === filter.month))
    .filter((r) => (!filter.from || r.date >= filter.from) && (!filter.to || r.date <= filter.to))
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export type { MonthRow };

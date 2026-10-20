"use server";

import { getDatabase } from "./mongodb";
import type { SaleRecord } from "./models";
import type { DailySales, Shift } from "@/lib/types";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "sales";
const SHIFTS: Shift[] = ["morning", "evening", "night"];

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Logs (or edits, if the same pump/date/shift was already submitted today)
// one shift's totals. Upsert instead of insert so re-submitting a
// correction never produces duplicate rows for the same shift.
export async function upsertSale(
  input: {
    pumpId: string;
    date: string;
    shift: Shift;
    petrolLitres: number;
    dieselLitres: number;
    cashRevenue: number;
    cardRevenue: number;
  },
  recordedBy: string
): Promise<SaleRecord> {
  const db = await getDatabase();
  const collection = db.collection<SaleRecord>(COLLECTION_NAME);

  const filter = {
    pumpId: new ObjectId(input.pumpId),
    date: input.date,
    shift: input.shift,
  };

  const now = new Date();
  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: {
        petrolLitres: input.petrolLitres,
        dieselLitres: input.dieselLitres,
        cashRevenue: input.cashRevenue,
        cardRevenue: input.cardRevenue,
        revenue: input.cashRevenue + input.cardRevenue,
        recordedBy: new ObjectId(recordedBy),
        updatedAt: now,
      },
      $setOnInsert: { ...filter, createdAt: now },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!result) throw new Error("Failed to save sale entry");
  return result;
}

export type SaveSaleResult =
  | { status: "saved"; sale: SaleRecord; replayed: boolean }
  | { status: "superseded"; current: SaleRecord };

// One unique entry per pump, date and shift. Created once; if it cannot be created (old duplicate rows), saves still run.
let saleIndexReady: Promise<unknown> | null = null;
function ensureSaleIndex(db: Awaited<ReturnType<typeof getDatabase>>) {
  saleIndexReady ??= db
    .collection(COLLECTION_NAME)
    .createIndex({ pumpId: 1, date: 1, shift: 1 }, { unique: true })
    .catch((error) => console.error("[SalesService] Unique index not created:", error));
  return saleIndexReady;
}

// Saves one shift's totals for a change the person made at `version.enteredAt`, with two server-side guards:
// - a request already saved (same Idempotency-Key) is answered as done, and nothing changes;
// - a change made before the saved entry (a late queued retry) does not overwrite the newer correction. It is refused.
// Without a request key or entry time, the save is unconditional, as upsertSale is.
export async function saveSale(
  input: {
    pumpId: string;
    date: string;
    shift: Shift;
    petrolLitres: number;
    dieselLitres: number;
    cashRevenue: number;
    cardRevenue: number;
  },
  recordedBy: string,
  version: { enteredAt?: Date; requestId?: string } = {}
): Promise<SaveSaleResult> {
  const db = await getDatabase();
  await ensureSaleIndex(db);
  const collection = db.collection<SaleRecord>(COLLECTION_NAME);
  const filter = { pumpId: new ObjectId(input.pumpId), date: input.date, shift: input.shift };

  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await collection.findOne(filter);
    const now = new Date();
    const values = {
      petrolLitres: input.petrolLitres,
      dieselLitres: input.dieselLitres,
      cashRevenue: input.cashRevenue,
      cardRevenue: input.cardRevenue,
      revenue: input.cashRevenue + input.cardRevenue,
      recordedBy: new ObjectId(recordedBy),
      updatedAt: now,
      ...(version.enteredAt ? { enteredAt: version.enteredAt } : {}),
      ...(version.requestId ? { lastRequestId: version.requestId } : {}),
    };

    if (!current) {
      try {
        const insert = { ...filter, ...values, createdAt: now };
        const result = await collection.insertOne(insert);
        return { status: "saved", sale: { ...insert, _id: result.insertedId }, replayed: false };
      } catch (error) {
        // Another save of the same shift got in first: read it again and apply the rules to it
        if ((error as { code?: number }).code === 11000) continue;
        throw error;
      }
    }

    if (version.requestId && current.lastRequestId === version.requestId) {
      return { status: "saved", sale: current, replayed: true };
    }
    if (version.enteredAt && current.enteredAt && current.enteredAt.getTime() > version.enteredAt.getTime()) {
      return { status: "superseded", current };
    }

    // Written only while the entry is still the one read above, so two saves cannot both win
    const unchanged = current.enteredAt ? { enteredAt: current.enteredAt } : { enteredAt: { $exists: false } };
    const updated = await collection.findOneAndUpdate({ _id: current._id, ...unchanged }, { $set: values }, { returnDocument: "after" });
    if (updated) return { status: "saved", sale: updated, replayed: false };
  }
  throw new Error("Could not save the sale entry, please try again");
}

export async function deleteSale(pumpId: string, date: string, shift: Shift): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection<SaleRecord>(COLLECTION_NAME);
    const result = await collection.deleteOne({
      pumpId: new ObjectId(pumpId),
      date,
      shift,
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("[SalesService] Delete error:", error);
    return false;
  }
}

// Builds a zero-filled DailySales[] for the last `days` days so charts stay
// continuous even on days nothing was logged yet.
export async function getSalesHistory(pumpId: string, days: number): Promise<DailySales[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<SaleRecord>(COLLECTION_NAME);

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const startDate = isoDate(start);

    const records = await collection
      .find({ pumpId: new ObjectId(pumpId), date: { $gte: startDate } })
      .toArray();

    const byDate = new Map<string, SaleRecord[]>();
    for (const record of records) {
      const list = byDate.get(record.date) ?? [];
      list.push(record);
      byDate.set(record.date, list);
    }

    const result: DailySales[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = isoDate(d);
      const dayRecords = byDate.get(date) ?? [];

      const shifts = SHIFTS.filter((shift) => dayRecords.some((r) => r.shift === shift)).map((shift) => {
        const r = dayRecords.find((rec) => rec.shift === shift)!;
        return {
          shift,
          petrolLitres: r.petrolLitres,
          dieselLitres: r.dieselLitres,
          revenue: r.revenue,
          cashRevenue: r.cashRevenue,
          cardRevenue: r.cardRevenue,
        };
      });

      result.push({
        date,
        petrolLitres: dayRecords.reduce((sum, r) => sum + r.petrolLitres, 0),
        dieselLitres: dayRecords.reduce((sum, r) => sum + r.dieselLitres, 0),
        revenue: dayRecords.reduce((sum, r) => sum + r.revenue, 0),
        cashRevenue: dayRecords.reduce((sum, r) => sum + r.cashRevenue, 0),
        cardRevenue: dayRecords.reduce((sum, r) => sum + r.cardRevenue, 0),
        shifts,
      });
    }

    return result;
  } catch (error) {
    console.error("[SalesService] Get history error:", error);
    const result: DailySales[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({ date: isoDate(d), petrolLitres: 0, dieselLitres: 0, revenue: 0, cashRevenue: 0, cardRevenue: 0, shifts: [] });
    }
    return result;
  }
}

export async function getTodaySales(pumpId: string): Promise<DailySales> {
  const history = await getSalesHistory(pumpId, 1);
  return (
    history[0] ?? {
      date: isoDate(new Date()),
      petrolLitres: 0,
      dieselLitres: 0,
      revenue: 0,
      cashRevenue: 0,
      cardRevenue: 0,
      shifts: [],
    }
  );
}

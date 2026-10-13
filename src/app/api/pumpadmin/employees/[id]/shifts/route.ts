import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import {
  dayKey,
  scheduledEnd,
  summarizeShifts,
  type ShiftRecord,
} from "@/lib/employee/shifts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };
const COLLECTION = "employeeShifts";

// Shift records for one employee of the signed-in pump, with the active shift
// and the Daily / Weekly / Monthly / Overall summaries.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;
    const employeeId = toId(id);
    const pumpId = toId(session?.pumpId);
    if (!employeeId || !pumpId) return json({ error: "Invalid request" }, 400);

    const db = await getDatabase();
    const employee = await db.collection("pump_employees").findOne({ _id: employeeId, pumpId });
    if (!employee) return json({ error: "Employee not found" }, 404);

    const docs = await db
      .collection(COLLECTION)
      .find({ employeeId, pumpId })
      .sort({ startedAt: -1 })
      .limit(2000)
      .toArray();

    const records = docs.map(toRecord);
    const now = new Date();
    return json({
      serverNow: now.toISOString(),
      shiftHours: employee.shiftHours || 8,
      active: records.find((r) => r.status === "active") ?? null,
      recent: records.slice(0, 50),
      summary: summarizeShifts(records, now),
    });
  } catch (error) {
    console.error("[EmployeeShifts] GET error:", error);
    return json({ error: "Failed to load shifts" }, 500);
  }
}

// body.action: "start" begins a shift from now, "end" closes the active shift
// once its assigned hours have passed.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;
    const employeeId = toId(id);
    const pumpId = toId(session?.pumpId);
    if (!employeeId || !pumpId) return json({ error: "Invalid request" }, 400);

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "start" && action !== "end") return json({ error: "Unknown action" }, 400);

    const db = await getDatabase();
    const employee = await db.collection("pump_employees").findOne({ _id: employeeId, pumpId });
    if (!employee) return json({ error: "Employee not found" }, 404);

    const shifts = db.collection(COLLECTION);
    const now = new Date();
    const active = await shifts.findOne({ employeeId, pumpId, status: "active" });

    if (action === "start") {
      if (active) return json({ error: "A shift is already running" }, 409);
      const shiftHours = Number(employee.shiftHours) > 0 ? Number(employee.shiftHours) : 8;
      const doc = {
        pumpId,
        employeeId,
        date: dayKey(now),
        status: "active",
        startedAt: now,
        scheduledEndAt: scheduledEnd(now, shiftHours),
        shiftHours,
        createdAt: now,
        updatedAt: now,
      };
      const result = await shifts.insertOne(doc);
      return json({ success: true, active: toRecord({ ...doc, _id: result.insertedId }) });
    }

    // action === "end"
    if (!active) return json({ error: "No shift is running" }, 404);
    const endsAt = new Date(active.scheduledEndAt);
    if (now.getTime() < endsAt.getTime()) {
      return json({ error: "The shift is not complete yet" }, 400);
    }
    const workedMinutes = Math.round((now.getTime() - new Date(active.startedAt).getTime()) / 60000);
    await shifts.updateOne(
      { _id: active._id },
      { $set: { status: "completed", endedAt: now, workedMinutes, updatedAt: now } }
    );
    return json({
      success: true,
      record: toRecord({ ...active, status: "completed", endedAt: now, workedMinutes }),
    });
  } catch (error) {
    console.error("[EmployeeShifts] POST error:", error);
    return json({ error: "Failed to update shift" }, 500);
  }
}

function toId(value: unknown): ObjectId | null {
  const s = String(value ?? "");
  return /^[a-f0-9]{24}$/i.test(s) ? new ObjectId(s) : null;
}

function toRecord(doc: any): ShiftRecord {
  return {
    id: String(doc._id),
    date: String(doc.date ?? ""),
    status: doc.status === "completed" ? "completed" : "active",
    startedAt: new Date(doc.startedAt).toISOString(),
    scheduledEndAt: new Date(doc.scheduledEndAt).toISOString(),
    endedAt: doc.endedAt ? new Date(doc.endedAt).toISOString() : undefined,
    workedMinutes: typeof doc.workedMinutes === "number" ? doc.workedMinutes : undefined,
    shiftHours: Number(doc.shiftHours) || 8,
  };
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

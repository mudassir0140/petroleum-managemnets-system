"use server";

import { getDatabase } from "./mongodb";
import type { AttendanceLog } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "attendance";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Called from the employee-login route on every successful login. Idempotent
// per (employeeId, date): the first login of the day creates the record and
// sets loginAt; any later login that same day is a no-op so loginAt always
// reflects when the employee actually started their day.
export async function markLogin(
  employeeId: string,
  pumpId?: string
): Promise<AttendanceLog | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AttendanceLog>(COLLECTION_NAME);
    const date = todayDateString();
    const employeeObjectId = new ObjectId(employeeId);

    const existing = await collection.findOne({ employeeId: employeeObjectId, date });
    if (existing) {
      return existing;
    }

    const record: AttendanceLog = {
      employeeId: employeeObjectId,
      pumpId: pumpId ? new ObjectId(pumpId) : undefined,
      date,
      loginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(record);
    return { ...record, _id: result.insertedId };
  } catch (error) {
    console.error("[AttendanceService] markLogin error:", error);
    return null;
  }
}

export async function markLogout(attendanceId: string): Promise<AttendanceLog | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AttendanceLog>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(attendanceId) },
      { $set: { logoutAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[AttendanceService] markLogout error:", error);
    return null;
  }
}

export async function getTodayAttendance(employeeId: string): Promise<AttendanceLog | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AttendanceLog>(COLLECTION_NAME);
    return await collection.findOne({
      employeeId: new ObjectId(employeeId),
      date: todayDateString(),
    });
  } catch (error) {
    console.error("[AttendanceService] getTodayAttendance error:", error);
    return null;
  }
}

export async function getAttendanceByEmployee(
  employeeId: string,
  limit = 30
): Promise<AttendanceLog[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AttendanceLog>(COLLECTION_NAME);
    return await collection
      .find({ employeeId: new ObjectId(employeeId) })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[AttendanceService] getAttendanceByEmployee error:", error);
    return [];
  }
}

// Admin-facing: every attendance record for a given date (defaults to
// today), newest login first.
export async function getAttendanceByDate(date?: string): Promise<AttendanceLog[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<AttendanceLog>(COLLECTION_NAME);
    return await collection
      .find({ date: date || todayDateString() })
      .sort({ loginAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[AttendanceService] getAttendanceByDate error:", error);
    return [];
  }
}

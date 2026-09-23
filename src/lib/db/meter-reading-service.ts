"use server";

import { getDatabase } from "./mongodb";
import type { MeterReading } from "./models";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "meterReadings";

export async function createMeterReading(reading: {
  employeeId: string;
  pumpId: string;
  attendanceId: string;
  type: "start" | "end";
  fuelType: "petrol" | "diesel";
  reading: number;
  photoDataUrl: string;
}): Promise<MeterReading | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<MeterReading>(COLLECTION_NAME);
    const date = new Date().toISOString().slice(0, 10);

    // One reading per (attendance, type) — resubmitting overwrites rather
    // than duplicating, so retries from a flaky upload never create two
    // "start" rows for the same shift.
    const filter = {
      attendanceId: new ObjectId(reading.attendanceId),
      type: reading.type,
    };

    const doc: MeterReading = {
      employeeId: new ObjectId(reading.employeeId),
      pumpId: new ObjectId(reading.pumpId),
      attendanceId: new ObjectId(reading.attendanceId),
      date,
      type: reading.type,
      fuelType: reading.fuelType,
      reading: reading.reading,
      photoDataUrl: reading.photoDataUrl,
      recordedAt: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      filter,
      { $set: doc },
      { upsert: true, returnDocument: "after" }
    );

    return result;
  } catch (error) {
    console.error("[MeterReadingService] createMeterReading error:", error);
    return null;
  }
}

export async function getReadingsByAttendance(attendanceId: string): Promise<MeterReading[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<MeterReading>(COLLECTION_NAME);
    return await collection
      .find({ attendanceId: new ObjectId(attendanceId) })
      .sort({ type: 1 })
      .toArray();
  } catch (error) {
    console.error("[MeterReadingService] getReadingsByAttendance error:", error);
    return [];
  }
}

export async function getReadingsByEmployee(
  employeeId: string,
  limit = 30
): Promise<MeterReading[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<MeterReading>(COLLECTION_NAME);
    return await collection
      .find({ employeeId: new ObjectId(employeeId) })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("[MeterReadingService] getReadingsByEmployee error:", error);
    return [];
  }
}

// Admin-facing: every reading recorded on a given date (defaults to today),
// used to join against attendance records for the admin attendance view.
export async function getReadingsByDate(date?: string): Promise<MeterReading[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<MeterReading>(COLLECTION_NAME);
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return await collection.find({ date: targetDate }).toArray();
  } catch (error) {
    console.error("[MeterReadingService] getReadingsByDate error:", error);
    return [];
  }
}

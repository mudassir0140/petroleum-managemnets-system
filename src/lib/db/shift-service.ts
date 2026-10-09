"use server";

import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface ShiftReading {
  timestamp: Date;
  meterReading: number;
  photoUrl?: string;
  notes?: string;
}

export interface Shift {
  _id?: ObjectId;
  pumpId: ObjectId;
  employeeId: ObjectId;
  attendantName: string;
  attendantEmail: string;
  date: Date;
  startShift?: ShiftReading;
  endShift?: ShiftReading;
  nozzleNumber?: string;
  fuelType?: "petrol" | "diesel";
  litresSold?: number;
  petrolRate?: number;
  dieselRate?: number;
  amountDue?: number;
  shiftHours?: number;
  expectedEndTime?: Date;
  isOvertime?: boolean;
  overtimeHours?: number;
  status: "in-progress" | "submitted" | "approved" | "rejected";
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createShift(
  pumpId: string,
  employeeId: string,
  attendantName: string,
  attendantEmail: string,
  shiftHours?: number
): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shift: Shift = {
      pumpId: new ObjectId(pumpId),
      employeeId: new ObjectId(employeeId),
      attendantName,
      attendantEmail,
      date: today,
      shiftHours: shiftHours || 8,
      status: "in-progress",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(shift);
    return { ...shift, _id: result.insertedId };
  } catch (error) {
    console.error("[ShiftService] Error creating shift:", error);
    return null;
  }
}

export async function updateShiftStartReading(
  shiftId: string,
  meterReading: number,
  nozzleNumber: string,
  fuelType: "petrol" | "diesel",
  photoUrl?: string
): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const shift = await collection.findOne({ _id: new ObjectId(shiftId) });
    if (!shift) return null;

    const startTime = new Date();
    const expectedEndTime = new Date(startTime);
    expectedEndTime.setHours(expectedEndTime.getHours() + (shift.shiftHours || 8));

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(shiftId) },
      {
        $set: {
          startShift: {
            timestamp: startTime,
            meterReading,
            photoUrl,
          },
          nozzleNumber,
          fuelType,
          expectedEndTime,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[ShiftService] Error updating start reading:", error);
    return null;
  }
}

export async function updateShiftEndReading(
  shiftId: string,
  meterReading: number,
  photoUrl?: string,
  petrolRate?: number,
  dieselRate?: number
): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const shift = await collection.findOne({ _id: new ObjectId(shiftId) });
    if (!shift || !shift.startShift) {
      throw new Error("Shift not found or start reading missing");
    }

    const litresSold = meterReading - shift.startShift.meterReading;
    const rate = shift.fuelType === "petrol" ? (petrolRate || 0) : (dieselRate || 0);
    const amountDue = litresSold * rate;

    const endTime = new Date();
    const startTime = shift.startShift.timestamp;
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const expectedDuration = shift.shiftHours || 8;
    const isOvertime = durationHours > expectedDuration;
    const overtimeHours = isOvertime ? durationHours - expectedDuration : 0;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(shiftId) },
      {
        $set: {
          endShift: {
            timestamp: endTime,
            meterReading,
            photoUrl,
          },
          litresSold,
          petrolRate,
          dieselRate,
          amountDue,
          isOvertime,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[ShiftService] Error updating end reading:", error);
    return null;
  }
}

export async function getShiftsByPump(pumpId: string, days: number = 30): Promise<Shift[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return await collection
      .find({
        pumpId: new ObjectId(pumpId),
        date: { $gte: sinceDate },
      })
      .sort({ date: -1 })
      .toArray();
  } catch (error) {
    console.error("[ShiftService] Error getting shifts:", error);
    return [];
  }
}

export async function getShiftsByEmployee(employeeId: string, days: number = 30): Promise<Shift[]> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return await collection
      .find({
        employeeId: new ObjectId(employeeId),
        date: { $gte: sinceDate },
      })
      .sort({ date: -1 })
      .toArray();
  } catch (error) {
    console.error("[ShiftService] Error getting employee shifts:", error);
    return [];
  }
}

export async function getTodayShift(pumpId: string, employeeId: string): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await collection.findOne({
      pumpId: new ObjectId(pumpId),
      employeeId: new ObjectId(employeeId),
      date: today,
    });
  } catch (error) {
    console.error("[ShiftService] Error getting today's shift:", error);
    return null;
  }
}

export async function approveShift(
  shiftId: string,
  approverId: string
): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(shiftId) },
      {
        $set: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: approverId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[ShiftService] Error approving shift:", error);
    return null;
  }
}

export async function rejectShift(
  shiftId: string,
  reason: string
): Promise<Shift | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Shift>("shifts");

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(shiftId) },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result || null;
  } catch (error) {
    console.error("[ShiftService] Error rejecting shift:", error);
    return null;
  }
}

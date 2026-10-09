"use server";

import { getDatabase } from "@/lib/db/mongodb";
import { getEmployeeSession } from "@/lib/employee/session";
import { ObjectId } from "mongodb";
import type { MeterReading, AttendanceLog } from "@/lib/db/models";

export async function GET(request: Request) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const db = await getDatabase();
    const readingsCollection = db.collection<MeterReading>("meterReadings");
    const attendanceCollection = db.collection<AttendanceLog>("attendance");

    // Get attendance records in date range
    const attendanceFilter: Record<string, any> = {
      employeeId: new ObjectId(session.employeeId),
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
      attendanceFilter.date = dateFilter;
    }

    const attendanceRecords = await attendanceCollection
      .find(attendanceFilter)
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    // Get meter readings for each attendance record
    const shiftData = await Promise.all(
      attendanceRecords.map(async (attendance) => {
        const readings = await readingsCollection
          .find({ attendanceId: attendance._id })
          .sort({ type: 1 })
          .toArray();

        const startReading = readings.find((r) => r.type === "start");
        const endReading = readings.find((r) => r.type === "end");

        let litresSold = 0;
        if (startReading && endReading) {
          litresSold = Number((endReading.reading - startReading.reading).toFixed(2));
        }

        const startTime = attendance.loginAt;
        const endTime = attendance.logoutAt;
        let hoursWorked = 0;
        if (endTime) {
          hoursWorked = Number(
            ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(2)
          );
        }

        return {
          id: attendance._id.toString(),
          date: attendance.date,
          startTime,
          endTime: endTime || null,
          startReading: startReading ? startReading.reading : null,
          endReading: endReading ? endReading.reading : null,
          litresSold,
          hoursWorked,
          fuelType: startReading?.fuelType || endReading?.fuelType || "petrol",
          hasStartPhoto: !!startReading?.photoDataUrl,
          hasEndPhoto: !!endReading?.photoDataUrl,
          status: endTime ? "Closed" : "Active",
        };
      })
    );

    return Response.json({
      success: true,
      data: shiftData,
    });
  } catch (error) {
    console.error("[ShiftsAPI] error:", error);
    return Response.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

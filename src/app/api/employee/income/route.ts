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
    const period = url.searchParams.get("period") || "monthly"; // daily or monthly
    const month = url.searchParams.get("month"); // YYYY-MM format

    const db = await getDatabase();
    const readingsCollection = db.collection<MeterReading>("meterReadings");
    const attendanceCollection = db.collection<AttendanceLog>("attendance");
    const ratesCollection = db.collection("fuel_rates");

    // Determine date range
    const now = new Date();
    const currentMonth = month ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthStr] = currentMonth.split("-");
    const monthNum = parseInt(monthStr);

    let startDate: string;
    let endDate: string;

    if (period === "daily") {
      startDate = endDate = now.toISOString().split("T")[0];
    } else {
      startDate = `${year}-${monthStr}-01`;
      const lastDay = new Date(parseInt(year), monthNum, 0).getDate();
      endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    }

    // Get attendance records
    const attendanceRecords = await attendanceCollection
      .find({
        employeeId: new ObjectId(session.employeeId),
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 })
      .toArray();

    // Get fuel rates (assuming latest rate or a specific date)
    const latestRate = await ratesCollection.findOne(
      {},
      { sort: { date: -1 } }
    );

    const petrolRate = latestRate?.petrol || 300; // Default fallback
    const dieselRate = latestRate?.diesel || 320;

    // Calculate income for each day
    const dailyData: Record<
      string,
      { litres: number; amount: number; fuelType: string }
    > = {};

    for (const attendance of attendanceRecords) {
      const readings = await readingsCollection
        .find({ attendanceId: attendance._id })
        .toArray();

      const startReading = readings.find((r) => r.type === "start");
      const endReading = readings.find((r) => r.type === "end");

      if (startReading && endReading) {
        const litres = Number((endReading.reading - startReading.reading).toFixed(2));
        const rate = startReading.fuelType === "petrol" ? petrolRate : dieselRate;
        const amount = Number((litres * rate).toFixed(2));
        const fuelType = startReading.fuelType;

        if (!dailyData[attendance.date]) {
          dailyData[attendance.date] = { litres: 0, amount: 0, fuelType };
        }

        dailyData[attendance.date].litres += litres;
        dailyData[attendance.date].amount += amount;
      }
    }

    const totalLitres = Object.values(dailyData).reduce((sum, day) => sum + day.litres, 0);
    const totalAmount = Object.values(dailyData).reduce((sum, day) => sum + day.amount, 0);

    return Response.json({
      success: true,
      period,
      month: currentMonth,
      startDate,
      endDate,
      totalLitres: Number(totalLitres.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      dailyData: Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          litres: Number(data.litres.toFixed(2)),
          amount: Number(data.amount.toFixed(2)),
          fuelType: data.fuelType,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
      rates: {
        petrol: petrolRate,
        diesel: dieselRate,
      },
    });
  } catch (error) {
    console.error("[IncomeAPI] error:", error);
    return Response.json({ error: "Failed to fetch income data" }, { status: 500 });
  }
}

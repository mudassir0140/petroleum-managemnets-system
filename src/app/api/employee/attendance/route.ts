"use server";

import { getDatabase } from "@/lib/db/mongodb";
import { getEmployeeSession } from "@/lib/employee/session";
import { ObjectId } from "mongodb";
import type { AttendanceLog } from "@/lib/db/models";

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
    const collection = db.collection<AttendanceLog>("attendance");

    const filter: Record<string, any> = {
      employeeId: new ObjectId(session.employeeId),
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {};
      if (startDate) dateFilter.$gte = startDate;
      if (endDate) dateFilter.$lte = endDate;
      filter.date = dateFilter;
    }

    const records = await collection
      .find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .toArray();

    return Response.json({
      success: true,
      data: records.map((record) => ({
        id: record._id.toString(),
        date: record.date,
        loginAt: record.loginAt,
        logoutAt: record.logoutAt,
      })),
    });
  } catch (error) {
    console.error("[AttendanceAPI] error:", error);
    return Response.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

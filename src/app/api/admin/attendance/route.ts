import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAttendanceByDate, getAttendanceByEmployee } from "@/lib/db/attendance-service";
import { getReadingsByAttendance } from "@/lib/db/meter-reading-service";
import { resolveApiActor, actorHasRole } from "@/lib/admin/api-auth";

// Matches DASHBOARD_NAV's roles for /dashboard/hr/employees (nav.ts) —
// that page's employee-detail view reads an individual's attendance
// history from here, so it needs the same access as the employees route.
const ALLOWED_ROLES = ["company-owner", "hr-manager"] as const;

// GET /api/admin/attendance                 -> today's attendance, all employees
// GET /api/admin/attendance?date=YYYY-MM-DD  -> that date's attendance, all employees
// GET /api/admin/attendance?employeeId=X     -> one employee's history (any role's
//                                                detail view can call this directly)
export async function GET(request: NextRequest) {
  const actor = await resolveApiActor();
  if (!actorHasRole(actor, ALLOWED_ROLES)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const date = searchParams.get("date") || undefined;

  if (employeeId) {
    if (!ObjectId.isValid(employeeId)) {
      return NextResponse.json({ error: "Invalid employeeId" }, { status: 400 });
    }
    const records = await getAttendanceByEmployee(employeeId);
    return NextResponse.json({
      success: true,
      attendance: records.map((r) => ({
        ...r,
        employeeId: r.employeeId.toString(),
        pumpId: r.pumpId?.toString(),
      })),
    });
  }

  const records = await getAttendanceByDate(date);
  // Join meter readings for any pump-attendant rows so the admin view shows
  // start/end readings + calculated dispensed litres without a second call.
  const withReadings = await Promise.all(
    records.map(async (r) => {
      const readings = r._id ? await getReadingsByAttendance(r._id.toString()) : [];
      const start = readings.find((x) => x.type === "start");
      const end = readings.find((x) => x.type === "end");
      const dispensed =
        start && end && start.fuelType === end.fuelType ? end.reading - start.reading : null;

      return {
        ...r,
        employeeId: r.employeeId.toString(),
        pumpId: r.pumpId?.toString(),
        meterReadings: {
          start: start
            ? { fuelType: start.fuelType, reading: start.reading, recordedAt: start.recordedAt, photoDataUrl: start.photoDataUrl }
            : null,
          end: end
            ? { fuelType: end.fuelType, reading: end.reading, recordedAt: end.recordedAt, photoDataUrl: end.photoDataUrl }
            : null,
          dispensedLitres: dispensed,
        },
      };
    })
  );

  return NextResponse.json({ success: true, attendance: withReadings });
}

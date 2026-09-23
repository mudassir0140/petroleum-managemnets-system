import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { createMeterReading, getReadingsByAttendance } from "@/lib/db/meter-reading-service";
import { getTodayAttendance, markLogout } from "@/lib/db/attendance-service";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // ~6MB, well under MongoDB's 16MB doc limit

export async function POST(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized — please log in first" }, { status: 401 });
    }
    if (!session.pumpId) {
      return NextResponse.json({ error: "No pump assigned to your account. Contact your administrator." }, { status: 400 });
    }

    const attendance = await getTodayAttendance(session.employeeId);
    if (!attendance?._id) {
      return NextResponse.json({ error: "No attendance record for today — please log in again." }, { status: 400 });
    }

    const body = await request.json();
    const { type, fuelType, reading, photoDataUrl } = body;

    if (type !== "start" && type !== "end") {
      return NextResponse.json({ error: "type must be 'start' or 'end'" }, { status: 400 });
    }
    if (fuelType !== "petrol" && fuelType !== "diesel") {
      return NextResponse.json({ error: "fuelType must be 'petrol' or 'diesel'" }, { status: 400 });
    }
    if (typeof reading !== "number" || !Number.isFinite(reading) || reading < 0) {
      return NextResponse.json({ error: "reading must be a non-negative number" }, { status: 400 });
    }
    if (typeof photoDataUrl !== "string" || !photoDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "A meter photo is required" }, { status: 400 });
    }
    if (photoDataUrl.length > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo is too large — please retake it" }, { status: 400 });
    }

    // Ending a shift needs a start reading already on record — you can't
    // close a duty that never opened.
    if (type === "end") {
      const existing = await getReadingsByAttendance(attendance._id.toString());
      if (!existing.some((r) => r.type === "start")) {
        return NextResponse.json({ error: "Submit a start-of-shift reading before ending your shift" }, { status: 400 });
      }
    }

    const saved = await createMeterReading({
      employeeId: session.employeeId,
      pumpId: session.pumpId,
      attendanceId: attendance._id.toString(),
      type,
      fuelType,
      reading,
      photoDataUrl,
    });

    if (!saved) {
      return NextResponse.json({ error: "Failed to save meter reading" }, { status: 500 });
    }

    // Ending a shift also closes out today's attendance record.
    if (type === "end") {
      await markLogout(attendance._id.toString());
    }

    return NextResponse.json({ success: true, reading: { ...saved, photoDataUrl: undefined } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[MeterReadingsAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendance = await getTodayAttendance(session.employeeId);
    if (!attendance?._id) {
      return NextResponse.json({ success: true, readings: [] });
    }

    const readings = await getReadingsByAttendance(attendance._id.toString());
    // Photos are only needed at capture/review time, not for the "have I
    // already submitted this?" gate check — keep the response small.
    return NextResponse.json({
      success: true,
      readings: readings.map((r) => ({ ...r, photoDataUrl: undefined })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

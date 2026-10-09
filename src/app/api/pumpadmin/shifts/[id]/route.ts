import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  updateShiftStartReading,
  updateShiftEndReading,
  approveShift,
  rejectShift,
} from "@/lib/db/shift-service";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, meterReading, nozzleNumber, fuelType, photoUrl } = body;

    if (action === "start") {
      if (meterReading === undefined || !nozzleNumber || !fuelType) {
        return NextResponse.json(
          { error: "Missing required fields for start shift" },
          { status: 400 }
        );
      }

      const shift = await updateShiftStartReading(
        id,
        meterReading,
        nozzleNumber,
        fuelType,
        photoUrl
      );

      if (!shift) {
        return NextResponse.json(
          { error: "Failed to start shift" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ...shift,
        _id: shift._id?.toString(),
        pumpId: shift.pumpId.toString(),
        employeeId: shift.employeeId.toString(),
      });
    }

    if (action === "end") {
      if (meterReading === undefined) {
        return NextResponse.json(
          { error: "Missing meter reading for end shift" },
          { status: 400 }
        );
      }

      const rates = await getCurrentFuelRates();
      const shift = await updateShiftEndReading(
        id,
        meterReading,
        photoUrl,
        rates?.petrolRate,
        rates?.dieselRate
      );

      if (!shift) {
        return NextResponse.json(
          { error: "Failed to end shift" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ...shift,
        _id: shift._id?.toString(),
        pumpId: shift.pumpId.toString(),
        employeeId: shift.employeeId.toString(),
      });
    }

    if (action === "approve") {
      const shift = await approveShift(id, session.pumpId);
      if (!shift) {
        return NextResponse.json(
          { error: "Failed to approve shift" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ...shift,
        _id: shift._id?.toString(),
        pumpId: shift.pumpId.toString(),
        employeeId: shift.employeeId.toString(),
      });
    }

    if (action === "reject") {
      const { reason } = body;
      if (!reason) {
        return NextResponse.json(
          { error: "Missing rejection reason" },
          { status: 400 }
        );
      }

      const shift = await rejectShift(id, reason);
      if (!shift) {
        return NextResponse.json(
          { error: "Failed to reject shift" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ...shift,
        _id: shift._id?.toString(),
        pumpId: shift.pumpId.toString(),
        employeeId: shift.employeeId.toString(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Shift Actions API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process shift action" },
      { status: 500 }
    );
  }
}

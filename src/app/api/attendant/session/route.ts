import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      employeeId: session.employeeId,
      pumpId: session.pumpId,
      role: session.role,
    });
  } catch (error) {
    console.error("[Attendant Session] error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

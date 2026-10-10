import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";

export async function GET() {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = session.pumpId;
    const rates = await getCurrentFuelRates(pumpId);

    if (!rates) {
      return NextResponse.json({
        petrolRate: 270,
        dieselRate: 290,
        date: new Date(),
        source: "default",
      });
    }

    return NextResponse.json({
      petrolRate: rates.petrolRate || 0,
      dieselRate: rates.dieselRate || 0,
      date: rates.date,
      source: rates.source,
      updatedAt: rates.updatedAt,
    });
  } catch (error) {
    console.error("[AttendantRates] GET error:", error);
    return NextResponse.json(
      { petrolRate: 270, dieselRate: 290, date: new Date() },
      { status: 200 }
    );
  }
}

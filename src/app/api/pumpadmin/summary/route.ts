import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getShiftsByPump } from "@/lib/db/shift-service";
import { getAttendanceByDate } from "@/lib/db/attendance-service";
import { getSalesHistory, getStockSnapshots, getIncomingTankers } from "@/lib/demo-data";
import { getCurrentFuelRates } from "@/lib/db/fuel-rates";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pumpId = session.pumpId;

    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sales data
    const salesHistory = await getSalesHistory(pumpId, 1);
    const todaySales = salesHistory[0];

    // Stock data
    const stock = getStockSnapshots(pumpId);
    const petrol = stock.find((s) => s.fuel === "petrol");
    const diesel = stock.find((s) => s.fuel === "diesel");

    // Shifts data
    const shifts = await getShiftsByPump(pumpId, 30);
    const todayShifts = shifts.filter(
      (s) => new Date(s.date).getTime() === today.getTime()
    );
    const submittedShifts = shifts.filter((s) => s.status === "submitted");

    // Attendants present today
    const attendanceList = await getAttendanceByDate();

    // Tankers
    const tankers = getIncomingTankers(pumpId);
    const now = Date.now();
    const upcomingTankers = tankers.filter(
      (t) => new Date(t.expectedArrival).getTime() > now
    );

    // Fuel rates
    const rates = await getCurrentFuelRates();

    // Khata balance (mock data for now)
    const khataBalance = 150000;

    return NextResponse.json({
      sales: {
        today: todaySales?.revenue || 0,
        litres: (todaySales?.petrolLitres || 0) + (todaySales?.dieselLitres || 0),
      },
      stock: {
        petrol: {
          litres: petrol?.currentLitres || 0,
          percentage: petrol
            ? Math.round((petrol.currentLitres / petrol.capacityLitres) * 100)
            : 0,
        },
        diesel: {
          litres: diesel?.currentLitres || 0,
          percentage: diesel
            ? Math.round((diesel.currentLitres / diesel.capacityLitres) * 100)
            : 0,
        },
      },
      shifts: {
        today: todayShifts.length,
        pending: submittedShifts.length,
      },
      attendance: attendanceList.length,
      tankers: upcomingTankers.length,
      khata: khataBalance,
      rates: {
        petrol: rates?.petrolRate || 270,
        diesel: rates?.dieselRate || 290,
      },
    });
  } catch (error) {
    console.error("[Summary API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

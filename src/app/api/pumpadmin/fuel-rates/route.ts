import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCurrentFuelRates, saveFuelRates } from "@/lib/db/fuel-rates";

export async function GET() {
  try {
    const rates = await getCurrentFuelRates();
    if (!rates) {
      return NextResponse.json({
        petrolRate: 270,
        dieselRate: 290,
        date: new Date(),
        source: "default"
      });
    }
    return NextResponse.json(rates);
  } catch (error) {
    console.error("[FuelRates API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel rates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.pumpId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { petrolRate, dieselRate } = body;

    if (petrolRate === undefined || dieselRate === undefined) {
      return NextResponse.json(
        { error: "Missing petrol or diesel rate" },
        { status: 400 }
      );
    }

    const rates = await saveFuelRates(petrolRate, dieselRate, "manual", true);
    return NextResponse.json(rates);
  } catch (error) {
    console.error("[FuelRates API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save fuel rates" },
      { status: 500 }
    );
  }
}

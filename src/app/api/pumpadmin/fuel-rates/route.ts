import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCurrentFuelRates, saveFuelRates, getPreviousFuelRate } from "@/lib/db/fuel-rates";

export async function GET() {
  try {
    const session = await getSession();
    const pumpId = session?.pumpId;

    const rates = await getCurrentFuelRates(pumpId);
    const previousRates = await getPreviousFuelRate(pumpId);

    if (!rates) {
      return NextResponse.json({
        petrolRate: 270,
        dieselRate: 290,
        date: new Date(),
        source: "default",
        change: { petrol: 0, diesel: 0 },
      });
    }

    return NextResponse.json({
      ...rates,
      change: previousRates ? {
        petrol: (rates.petrolRate || 0) - (previousRates.petrolRate || 0),
        diesel: (rates.dieselRate || 0) - (previousRates.dieselRate || 0),
      } : {
        petrol: 0,
        diesel: 0,
      },
    });
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

    const rates = await saveFuelRates(
      petrolRate,
      dieselRate,
      session.pumpId,
      "manual",
      "pump-owner"
    );

    const previousRates = await getPreviousFuelRate(session.pumpId);

    return NextResponse.json({
      ...rates,
      change: previousRates ? {
        petrol: (rates?.petrolRate || 0) - (previousRates.petrolRate || 0),
        diesel: (rates?.dieselRate || 0) - (previousRates.dieselRate || 0),
      } : {
        petrol: 0,
        diesel: 0,
      },
    });
  } catch (error) {
    console.error("[FuelRates API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save fuel rates" },
      { status: 500 }
    );
  }
}

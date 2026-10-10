import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    // Get today's fuel rates (same source as pump owner/admin dashboards)
    // Assuming rates are stored in a fuel_prices or rates collection
    const ratesCollection = db.collection("fuel_prices");

    // Get the most recent rates
    const rates = await ratesCollection
      .findOne(
        {},
        { sort: { createdAt: -1 } }
      );

    if (!rates) {
      // Return default rates if none found
      return NextResponse.json({
        petrol: 200,
        diesel: 180,
        lastUpdated: new Date(),
      });
    }

    return NextResponse.json({
      petrol: rates.petrol || 200,
      diesel: rates.diesel || 180,
      lastUpdated: rates.createdAt || new Date(),
    });
  } catch (error) {
    console.error("[AttendantRates] GET error:", error);
    return NextResponse.json(
      { petrol: 200, diesel: 180, lastUpdated: new Date() },
      { status: 200 }
    );
  }
}

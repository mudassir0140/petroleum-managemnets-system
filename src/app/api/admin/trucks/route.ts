import { NextRequest, NextResponse } from "next/server";
import { getAvailableTrucks } from "@/lib/db/truck-service";

export async function GET(request: NextRequest) {
  try {
    const quantityLitres = request.nextUrl.searchParams.get("quantityLitres");

    if (!quantityLitres || isNaN(Number(quantityLitres))) {
      return NextResponse.json(
        { error: "quantityLitres parameter is required and must be a number" },
        { status: 400 }
      );
    }

    const trucks = await getAvailableTrucks(Number(quantityLitres));
    return NextResponse.json({ success: true, trucks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[TrucksAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

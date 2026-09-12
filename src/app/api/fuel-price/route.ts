import { NextResponse } from "next/server";
import { getCurrentFuelPrice } from "@/lib/fuel-price-store";

// Read-only endpoint: Pump Owners poll this to reflect Company-set prices
// instantly. There is intentionally no PUT/POST here — pump owners cannot
// change fuel prices, only the Company's system can.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getCurrentFuelPrice());
}

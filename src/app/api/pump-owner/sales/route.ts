import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getPumpById } from "@/lib/db/pump-service";
import { upsertSale, deleteSale, getSalesHistory } from "@/lib/db/sales-service";

const SHIFTS = ["morning", "evening", "night"] as const;

// Every route below only ever reads/writes the pump tied to the caller's own
// session cookie — never a client-supplied pumpId — so one pump owner can
// never log or read another pump's sales.
async function getPumpOwnerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pump_owner_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    if (typeof session.pumpId !== "string" || !ObjectId.isValid(session.pumpId)) return null;
    return session.pumpId;
  } catch {
    return null;
  }
}

const UNAUTHORIZED = { error: "Unauthorized — please log in as a Pump Owner first (/pump-owner/login)" };

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const pumpId = await getPumpOwnerId();
    if (!pumpId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const daysParam = request.nextUrl.searchParams.get("days");
    const days = Math.min(Math.max(Number(daysParam) || 30, 1), 90);

    const history = await getSalesHistory(pumpId, days);
    return NextResponse.json({ success: true, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpOwnerSalesAPI] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pumpId = await getPumpOwnerId();
    if (!pumpId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const pump = await getPumpById(pumpId);
    if (!pump) {
      return NextResponse.json({ error: "Pump not found" }, { status: 404 });
    }

    const body = await request.json();
    const { date, shift, petrolLitres, dieselLitres, cashRevenue, cardRevenue } = body;

    if (!SHIFTS.includes(shift)) {
      return NextResponse.json({ error: `shift must be one of: ${SHIFTS.join(", ")}` }, { status: 400 });
    }

    const entryDate = typeof date === "string" && date.trim() ? date.trim() : isoDate(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      return NextResponse.json({ error: "date must be an ISO date (YYYY-MM-DD)" }, { status: 400 });
    }
    if (entryDate > isoDate(new Date())) {
      return NextResponse.json({ error: "date cannot be in the future" }, { status: 400 });
    }

    const numericFields = { petrolLitres, dieselLitres, cashRevenue, cardRevenue };
    for (const [key, value] of Object.entries(numericFields)) {
      if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        return NextResponse.json({ error: `${key} must be a non-negative number` }, { status: 400 });
      }
    }

    const sale = await upsertSale(
      { pumpId, date: entryDate, shift, petrolLitres, dieselLitres, cashRevenue, cardRevenue },
      pumpId
    );

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpOwnerSalesAPI] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pumpId = await getPumpOwnerId();
    if (!pumpId) {
      return NextResponse.json(UNAUTHORIZED, { status: 401 });
    }

    const date = request.nextUrl.searchParams.get("date");
    const shift = request.nextUrl.searchParams.get("shift");
    if (!date || !shift || !SHIFTS.includes(shift as (typeof SHIFTS)[number])) {
      return NextResponse.json({ error: "date and shift query params are required" }, { status: 400 });
    }

    const deleted = await deleteSale(pumpId, date, shift as (typeof SHIFTS)[number]);
    if (!deleted) {
      return NextResponse.json({ error: "Sale entry not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PumpOwnerSalesAPI] DELETE error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

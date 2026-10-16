import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { ObjectId } from "mongodb";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";
import { loadAccountLedgers } from "@/lib/khata/monthly";
import { monthKeyOf } from "@/lib/khata/ledger";
import { toLegacyMonth } from "@/lib/khata/legacy-month";

// Month figures are computed from the dated records, so they are read live every time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Every month of one account, newest first, computed from its records.
export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const khataClientId = new URL(request.url).searchParams.get("khataClientId");
    if (!khataClientId || !ObjectId.isValid(khataClientId)) {
      return NextResponse.json({ error: "Missing khata client ID" }, { status: 400 });
    }

    const pumpId = new ObjectId(owner.pumpId);
    const [ledger] = await loadAccountLedgers(pumpId, new Date(), [new ObjectId(khataClientId)]);
    if (!ledger) return NextResponse.json({ error: "Khata not found" }, { status: 404 });

    const months = [...ledger.rows].reverse().map((row) => toLegacyMonth(row, khataClientId, String(pumpId)));
    return NextResponse.json(months, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Khata Months] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch khata months" }, { status: 500 });
  }
}

// Months start by themselves when a record is dated in them. Nothing is created here, so there can
// never be a duplicate month. The response is the current month.
export async function POST(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const khataClientId = typeof body?.khataClientId === "string" ? body.khataClientId : "";
    if (!ObjectId.isValid(khataClientId)) {
      return NextResponse.json({ error: "Missing khata client ID" }, { status: 400 });
    }

    const now = new Date();
    const pumpId = new ObjectId(owner.pumpId);
    const [ledger] = await loadAccountLedgers(pumpId, now, [new ObjectId(khataClientId)]);
    if (!ledger) return NextResponse.json({ error: "Khata not found" }, { status: 404 });

    const current = monthKeyOf(now);
    const row = ledger.rows.find((r) => r.month === current);
    return NextResponse.json(row ? toLegacyMonth(row, khataClientId, String(pumpId)) : { month: current });
  } catch (error) {
    console.error("[Khata Months] POST error:", error);
    return NextResponse.json({ error: "Failed to load the current month" }, { status: 500 });
  }
}

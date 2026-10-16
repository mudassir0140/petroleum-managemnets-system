import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { ObjectId } from "mongodb";
import { loadAccountLedgers } from "@/lib/khata/monthly";
import { isMonthKey, monthKeyOf } from "@/lib/khata/ledger";
import { toLegacyMonth } from "@/lib/khata/legacy-month";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// One month of one account. The id is the month itself ("2026-09"), with the account in the query.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = (await params).id;
    const khataClientId = new URL(request.url).searchParams.get("khataClientId") ?? "";
    if (!isMonthKey(month) || !ObjectId.isValid(khataClientId)) {
      return NextResponse.json({ error: "Month not found" }, { status: 404 });
    }

    const pumpId = new ObjectId(owner.pumpId);
    const [ledger] = await loadAccountLedgers(pumpId, new Date(), [new ObjectId(khataClientId)]);
    const row = ledger?.rows.find((r) => r.month === month);
    if (!ledger || !row) return NextResponse.json({ error: "Month not found" }, { status: 404 });

    return NextResponse.json({
      ...toLegacyMonth(row, khataClientId, String(pumpId)),
      entries: ledger.entries.filter((e) => monthKeyOf(e.date) === month),
      payments: ledger.payments.filter((p) => monthKeyOf(p.date) === month),
    });
  } catch (error) {
    console.error("[Khata Months] GET [id] error:", error);
    return NextResponse.json({ error: "Failed to fetch khata month" }, { status: 500 });
  }
}

// Month totals are no longer typed in. Change the payments and fuel records instead, which keeps the audit trail.
export async function PUT() {
  return NextResponse.json({ error: "Month totals are calculated from the records. Edit a payment instead." }, { status: 405 });
}

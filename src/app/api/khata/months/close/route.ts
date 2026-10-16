import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { ObjectId } from "mongodb";
import { closeMonth } from "@/lib/khata/monthly";
import { isMonthKey } from "@/lib/khata/ledger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Closes one account's past month. The owner must confirm, and must confirm the exact closing balance
// they reviewed, so a change made since then stops the close.
export async function POST(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const khataClientId = typeof body?.khataClientId === "string" ? body.khataClientId : "";
    const month = typeof body?.month === "string" ? body.month : "";
    if (!ObjectId.isValid(khataClientId) || !isMonthKey(month)) {
      return NextResponse.json({ error: "Choose the account and the month" }, { status: 400 });
    }
    const expectedClosing = Number(body?.expectedClosing);
    if (!Number.isFinite(expectedClosing)) {
      return NextResponse.json({ error: "Review the closing balance before closing" }, { status: 400 });
    }

    const result = await closeMonth(
      new ObjectId(owner.pumpId),
      new ObjectId(khataClientId),
      month,
      { confirmed: body?.confirmed === true, expectedClosing, closedBy: owner.name },
      new Date()
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ success: true, month: result.row.month, closing: result.row.closing });
  } catch (error) {
    console.error("[Khata Months] close error:", error);
    return NextResponse.json({ error: "Failed to close the month" }, { status: 500 });
  }
}

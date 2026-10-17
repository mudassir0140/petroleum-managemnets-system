import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { accountsSummary } from "@/lib/khata/accounts";
import { isMonthKey, monthKeyOf } from "@/lib/khata/ledger";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The monthly and overall accounts: totals by method, dues and closing balance, daily totals, and the bank
// accounts and wallet providers. The month defaults to the current month in Pakistan time.
export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const requested = new URL(request.url).searchParams.get("month");
    const month = isMonthKey(requested) ? requested : monthKeyOf(now);
    const summary = await accountsSummary(owner.pumpId, now, month);
    return NextResponse.json(summary, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Khata Accounts] GET error:", error);
    return NextResponse.json({ error: "Failed to load the accounts" }, { status: 500 });
  }
}

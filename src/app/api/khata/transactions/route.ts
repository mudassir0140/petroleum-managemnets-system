import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { listTransactions } from "@/lib/khata/transactions";
import { isMonthKey } from "@/lib/khata/ledger";
import { isDateOnlyValue, isPaymentMethod } from "@/lib/khata/payments";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Every transaction of the pump, newest first. Filters: month, from, to, method, khataClientId.
export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = new URL(request.url).searchParams;
    const month = params.get("month") ?? undefined;
    const from = params.get("from") ?? undefined;
    const to = params.get("to") ?? undefined;
    const method = params.get("method") ?? undefined;
    if (month && !isMonthKey(month)) return NextResponse.json({ error: "Choose a valid month" }, { status: 400 });
    if (from && !isDateOnlyValue(from)) return NextResponse.json({ error: "Choose a valid start date" }, { status: 400 });
    if (to && !isDateOnlyValue(to)) return NextResponse.json({ error: "Choose a valid end date" }, { status: 400 });
    if (method && method !== "fuel" && !isPaymentMethod(method)) return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });

    const rows = await listTransactions(owner.pumpId, new Date(), {
      month,
      from,
      to,
      method,
      khataClientId: params.get("khataClientId") ?? undefined,
    });
    return NextResponse.json(rows, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Khata Transactions] GET error:", error);
    return NextResponse.json({ error: "Failed to load the transactions" }, { status: 500 });
  }
}

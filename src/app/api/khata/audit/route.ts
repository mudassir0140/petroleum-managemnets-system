import { NextRequest, NextResponse } from "next/server";
import { khataOwner } from "@/lib/khata/api-session";
import { ObjectId } from "mongodb";
import { listAudit } from "@/lib/khata/monthly";
import { KHATA_NO_STORE_HEADERS } from "@/lib/khata/no-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// The audit history of one account: every payment, edit and month close, with who changed what and when.
export async function GET(request: NextRequest) {
  try {
    const owner = await khataOwner();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const khataClientId = new URL(request.url).searchParams.get("khataClientId") ?? "";
    if (!ObjectId.isValid(khataClientId)) {
      return NextResponse.json({ error: "Missing khata client ID" }, { status: 400 });
    }
    const rows = await listAudit(new ObjectId(owner.pumpId), new ObjectId(khataClientId));
    return NextResponse.json(rows, { headers: KHATA_NO_STORE_HEADERS });
  } catch (error) {
    console.error("[Khata Audit] GET error:", error);
    return NextResponse.json({ error: "Failed to load the audit history" }, { status: 500 });
  }
}

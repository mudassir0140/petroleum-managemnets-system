import { NextRequest, NextResponse } from "next/server";
import { toObjectId } from "@/lib/khata/ids";
import { getSupplierAccount } from "@/lib/supplier/session";
import { respondToSupplierRequest } from "@/lib/supplier/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Supplier accepts or rejects a pending request.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await getSupplierAccount();
    if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requestId = toObjectId((await params).id);
    if (!requestId) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Action must be accept or reject" }, { status: 400 });
    }

    const result = await respondToSupplierRequest(account, requestId, action);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, ...result.data });
  } catch (error) {
    console.error("[SupplierRequest] POST error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

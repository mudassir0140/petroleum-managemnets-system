import { NextRequest, NextResponse } from "next/server";
import { getPendingApprovalRequests, getAllApprovalRequests } from "@/lib/db/approvals";
import { initializeDatabase } from "@/lib/db/init";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const pending = searchParams.get("pending");

    let requests;
    if (pending === "true") {
      requests = await getPendingApprovalRequests();
    } else {
      requests = await getAllApprovalRequests();
    }

    return NextResponse.json({ success: true, requests }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Get approval requests error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

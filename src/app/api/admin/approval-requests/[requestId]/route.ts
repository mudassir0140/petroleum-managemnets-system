import { NextRequest, NextResponse } from "next/server";
import { approveApprovalRequest, rejectApprovalRequest, getApprovalRequestById } from "@/lib/db/approvals";
import { updateUser } from "@/lib/db/users";
import { initializeDatabase } from "@/lib/db/init";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await initializeDatabase();

    const { requestId } = await params;
    const body = await request.json();
    const { action, approvedBy, reason } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    let approvalRequest = await getApprovalRequestById(requestId);

    if (!approvalRequest) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      approvalRequest = await approveApprovalRequest(requestId, approvedBy || "admin");

      if (approvalRequest) {
        await updateUser(approvalRequest.userEmail, {
          approvalStatus: "approved",
          approvedAt: new Date().toISOString(),
          approvedBy: approvedBy || "admin",
        });
      }

      return NextResponse.json(
        { success: true, approvalRequest, message: "Request approved" },
        { status: 200 }
      );
    } else {
      approvalRequest = await rejectApprovalRequest(requestId, approvedBy || "admin", reason);

      if (approvalRequest) {
        await updateUser(approvalRequest.userEmail, {
          approvalStatus: "rejected",
          rejectionReason: reason,
        });
      }

      return NextResponse.json(
        { success: true, approvalRequest, message: "Request rejected" },
        { status: 200 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Approval request update error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

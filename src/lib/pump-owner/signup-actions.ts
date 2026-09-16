"use server";

import { getPumpByEmail } from "@/lib/db/pumps";
import { getUserByEmail, createUser } from "@/lib/db/users";
import { getApprovalRequestByEmail, createApprovalRequest, generateRequestId } from "@/lib/db/approvals";
import { initializeDatabase } from "@/lib/db/init";
import type { PumpOwnerSignupRequest } from "@/lib/pump-owner/types";

// Create pump owner signup request (called during signup)
export async function createPumpOwnerSignupRequest(
  email: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    console.log("[Pump Owner Signup] Starting signup request creation for email:", email);
    await initializeDatabase();

    const pump = await getPumpByEmail(email);
    console.log("[Pump Owner Signup] Pump lookup result:", pump ? `Found pump ${pump.pumpId}` : "No pump found");

    if (!pump) {
      console.log("[Pump Owner Signup] No pump found with email:", email);
      return {
        success: false,
        error: "This email is not authorized for pump owner signup. Please contact admin.",
      };
    }

    console.log("[Pump Owner Signup] Pump matched:", pump.pumpId, "-", pump.pumpName);

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log("[Pump Owner Signup] User already exists");
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const existingRequest = await getApprovalRequestByEmail(email);
    if (existingRequest && existingRequest.status !== "rejected") {
      console.log("[Pump Owner Signup] Existing request found with status:", existingRequest.status);
      return {
        success: false,
        error: "A signup request for this email is already pending.",
      };
    }

    console.log("[Pump Owner Signup] Creating user with pending approval status");

    const now = new Date().toISOString();

    const user = await createUser({
      email,
      passwordHash: "", // Will be set during account creation
      role: "pump-owner",
      pumpId: pump.pumpId,
      approvalStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    const requestId = await generateRequestId();

    const approvalRequest = await createApprovalRequest({
      requestId,
      userEmail: email,
      requestType: "pump-owner",
      pumpId: pump.pumpId,
      pumpName: pump.pumpName,
      pumpOwnerName: pump.ownerName,
      status: "pending",
      createdAt: now,
    });

    console.log("[Pump Owner Signup] SUCCESS - Signup request created with ID:", requestId);

    return { success: true, requestId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Pump Owner Signup] ERROR:", errorMsg);
    return {
      success: false,
      error: `Failed to create signup request: ${errorMsg}`,
    };
  }
}

// Get all pending pump owner signup requests for admin
export async function getPendingPumpOwnerSignupRequests(): Promise<PumpOwnerSignupRequest[]> {
  try {
    await initializeDatabase();
    const { getPendingPumpOwnerRequests } = await import("@/lib/db/approvals");
    const requests = await getPendingPumpOwnerRequests();
    return requests.map((r) => ({
      id: r.requestId,
      email: r.userEmail,
      pumpId: r.pumpId || "",
      pumpName: r.pumpName || "",
      ownerName: r.pumpOwnerName || "",
      ownerPhone: "",
      address: "",
      city: r.city || "",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt,
      approvedAt: r.approvedAt,
      approvedBy: r.approvedBy,
      rejectionReason: r.rejectionReason,
    }));
  } catch (error) {
    console.error("[Pump Owner Signup] Get requests error:", error);
    return [];
  }
}

// Admin: Approve pump owner signup request
export async function approvePumpOwnerSignupRequest(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await initializeDatabase();
    const { approveApprovalRequest } = await import("@/lib/db/approvals");
    const request = await approveApprovalRequest(requestId, adminId);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    await updateUser(request.userEmail, {
      approvalStatus: "approved",
      approvedAt: new Date(),
      approvedBy: adminId,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Admin: Reject pump owner signup request
export async function rejectPumpOwnerSignupRequest(
  requestId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await initializeDatabase();
    const { rejectApprovalRequest } = await import("@/lib/db/approvals");
    const request = await rejectApprovalRequest(requestId, adminId, reason);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    await updateUser(request.userEmail, {
      approvalStatus: "rejected",
      rejectionReason: reason,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

// Check pump owner signup request status
export async function checkPumpOwnerSignupStatus(email: string): Promise<{
  status: "not-found" | "pending" | "approved" | "rejected" | "active";
  message?: string;
}> {
  try {
    await initializeDatabase();
    const user = await getUserByEmail(email);

    if (!user) {
      return { status: "not-found", message: "No signup found" };
    }

    if (user.approvalStatus === "rejected") {
      return { status: "rejected", message: user.rejectionReason || "Request was rejected" };
    }

    if (user.approvalStatus === "pending") {
      return { status: "pending", message: "Waiting for admin approval" };
    }

    if (user.approvalStatus === "approved") {
      return { status: "approved", message: "Approved by admin" };
    }

    return { status: "not-found" };
  } catch {
    return { status: "not-found" };
  }
}

async function updateUser(email: string, updates: any) {
  const { updateUser: dbUpdateUser } = await import("@/lib/db/users");
  return dbUpdateUser(email, updates);
}

"use server";

import { getEmployeeByEmail } from "@/lib/db/employees";
import { getUserByEmail, createUser } from "@/lib/db/users";
import { getApprovalRequestByEmail, createApprovalRequest, generateRequestId } from "@/lib/db/approvals";
import { initializeDatabase } from "@/lib/db/init";

export async function createEmployeeSignupRequest(
  email: string,
  role: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    console.log("[Employee Signup] Starting signup request creation for email:", email, "role:", role);
    await initializeDatabase();

    const employee = await getEmployeeByEmail(email, role);
    console.log("[Employee Signup] Employee lookup result:", employee ? `Found employee ${employee.employeeId}` : "No employee found");

    if (!employee) {
      console.log("[Employee Signup] No employee found with email:", email, "for role:", role);
      return {
        success: false,
        error: `This email is not authorized for ${role} role. Please contact admin.`,
      };
    }

    console.log("[Employee Signup] Employee matched:", employee.employeeId, "-", employee.name);

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log("[Employee Signup] User already exists");
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const existingRequest = await getApprovalRequestByEmail(email);
    if (existingRequest && existingRequest.status !== "rejected") {
      console.log("[Employee Signup] Existing request found with status:", existingRequest.status);
      return {
        success: false,
        error: "A signup request for this email is already pending.",
      };
    }

    console.log("[Employee Signup] Creating user with pending approval status");

    const user = await createUser({
      email,
      passwordHash: "",
      role: "employee",
      employeeId: employee.employeeId,
      approvalStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const requestId = await generateRequestId();

    const approvalRequest = await createApprovalRequest({
      requestId,
      userEmail: email,
      requestType: "employee",
      employeeId: employee.employeeId,
      employeeName: employee.name,
      employeePhone: employee.phone,
      role: employee.role,
      status: "pending",
      createdAt: new Date(),
    });

    console.log("[Employee Signup] SUCCESS - Signup request created with ID:", requestId);

    return { success: true, requestId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Employee Signup] ERROR:", errorMsg);
    return {
      success: false,
      error: `Failed to create signup request: ${errorMsg}`,
    };
  }
}

export async function getPendingEmployeeSignupRequests() {
  try {
    await initializeDatabase();
    const { getPendingEmployeeRequests } = await import("@/lib/db/approvals");
    const requests = await getPendingEmployeeRequests();
    return requests.map((r) => ({
      id: r.requestId,
      email: r.userEmail,
      employeeId: r.employeeId || "",
      name: r.employeeName || "",
      phone: r.employeePhone || "",
      role: r.role || "",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      approvedBy: r.approvedBy,
      rejectionReason: r.rejectionReason,
    }));
  } catch (error) {
    console.error("[Employee Signup] Get requests error:", error);
    return [];
  }
}

export async function approveEmployeeSignupRequest(
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

export async function rejectEmployeeSignupRequest(
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

async function updateUser(email: string, updates: any) {
  const { updateUser: dbUpdateUser } = await import("@/lib/db/users");
  return dbUpdateUser(email, updates);
}

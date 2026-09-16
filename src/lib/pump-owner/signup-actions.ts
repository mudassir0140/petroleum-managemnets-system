"use server";

import { cookies } from "next/headers";
import { getStoredPumps } from "@/lib/pump-owner/storage";
import type { PumpOwnerSignupRequest } from "@/lib/pump-owner/types";

const PUMP_OWNER_SIGNUP_REQUESTS_COOKIE = "pump_owner_signup_requests";

async function getSignupRequests(): Promise<PumpOwnerSignupRequest[]> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(PUMP_OWNER_SIGNUP_REQUESTS_COOKIE)?.value;
    return cookie ? JSON.parse(cookie) : [];
  } catch {
    return [];
  }
}

async function saveSignupRequests(requests: PumpOwnerSignupRequest[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PUMP_OWNER_SIGNUP_REQUESTS_COOKIE, JSON.stringify(requests), {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

// Create pump owner signup request (called during signup)
export async function createPumpOwnerSignupRequest(
  email: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    console.log("[Pump Owner Signup] Starting signup request creation for email:", email);

    const pumps = await getStoredPumps();
    console.log("[Pump Owner Signup] Retrieved", pumps.length, "pumps from storage");
    console.log("[Pump Owner Signup] Available pump emails:", pumps.map((p) => p.ownerEmail));

    // Check if email is assigned to any pump
    const matchingPump = pumps.find((p) => {
      const match = p.ownerEmail?.toLowerCase() === email?.toLowerCase();
      if (match) {
        console.log("[Pump Owner Signup] Email match found for pump:", p.pumpId, p.pumpName);
      }
      return match;
    });

    if (!matchingPump) {
      console.log("[Pump Owner Signup] No pump found with email:", email);
      return {
        success: false,
        error: "This email is not authorized for pump owner signup. Please contact admin.",
      };
    }

    console.log("[Pump Owner Signup] Pump matched:", matchingPump.pumpId, "-", matchingPump.pumpName);

    const requests = await getSignupRequests();
    console.log("[Pump Owner Signup] Retrieved", requests.length, "existing signup requests");

    // Check if account already exists for this pump's email
    const existingRequest = requests.find(
      (r) => r.email?.toLowerCase() === email?.toLowerCase() && r.status !== "rejected"
    );

    if (existingRequest) {
      console.log("[Pump Owner Signup] Existing request found with status:", existingRequest.status);
      return {
        success: false,
        error: "Sorry, an account for this pump has already been created.",
      };
    }

    console.log("[Pump Owner Signup] No existing request found, proceeding to create new request");

    const request: PumpOwnerSignupRequest = {
      id: `PO-REQ-${Date.now()}`,
      email,
      pumpId: matchingPump.pumpId,
      pumpName: matchingPump.pumpName,
      ownerName: matchingPump.ownerName,
      ownerPhone: matchingPump.ownerPhone,
      address: matchingPump.address,
      city: matchingPump.city,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    console.log("[Pump Owner Signup] Created request object:", request);

    requests.push(request);
    console.log("[Pump Owner Signup] Saving", requests.length, "total requests to storage");

    await saveSignupRequests(requests);
    console.log("[Pump Owner Signup] Successfully saved request to storage");
    console.log("[Pump Owner Signup] SUCCESS - Signup request created with ID:", request.id);

    return { success: true, requestId: request.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("[Pump Owner Signup] ERROR CAUGHT:", errorMsg);
    console.error("[Pump Owner Signup] ERROR STACK:", errorStack);
    console.error("[Pump Owner Signup] FULL ERROR OBJECT:", error);

    return {
      success: false,
      error: `Failed to create signup request: ${errorMsg}`,
    };
  }
}

// Get all pending pump owner signup requests for admin
export async function getPendingPumpOwnerSignupRequests(): Promise<PumpOwnerSignupRequest[]> {
  try {
    const requests = await getSignupRequests();
    return requests.filter((r) => r.status === "pending");
  } catch {
    return [];
  }
}

// Admin: Approve pump owner signup request
export async function approvePumpOwnerSignupRequest(
  requestId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requests = await getSignupRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request has already been processed" };
    }

    request.status = "approved";
    request.approvedAt = new Date().toISOString();
    request.approvedBy = adminId;

    await saveSignupRequests(requests);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve request" };
  }
}

// Admin: Reject pump owner signup request
export async function rejectPumpOwnerSignupRequest(
  requestId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requests = await getSignupRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.status !== "pending") {
      return { success: false, error: "Request has already been processed" };
    }

    request.status = "rejected";
    request.approvedBy = adminId;
    if (reason) request.rejectionReason = reason;

    await saveSignupRequests(requests);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reject request" };
  }
}

// Check pump owner signup request status
export async function checkPumpOwnerSignupStatus(email: string): Promise<{
  status: "not-found" | "pending" | "approved" | "rejected" | "active";
  message?: string;
}> {
  try {
    const requests = await getSignupRequests();
    const request = requests.find((r) => r.email?.toLowerCase() === email?.toLowerCase());

    if (!request) {
      return { status: "not-found", message: "No signup request found" };
    }

    if (request.status === "rejected") {
      return { status: "rejected", message: request.rejectionReason || "Request was rejected" };
    }

    if (request.status === "pending") {
      return { status: "pending", message: "Waiting for admin approval" };
    }

    if (request.status === "approved") {
      return { status: "approved", message: "Approved by admin" };
    }

    return { status: "not-found" };
  } catch {
    return { status: "not-found" };
  }
}

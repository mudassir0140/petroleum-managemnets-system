"use server";

import {
  createApprovalRequest as createApprovalRequestInStorage,
  getApprovalRequestById as getApprovalRequestByIdInStorage,
  getAllApprovalRequests as getAllApprovalRequestsInStorage,
  getPendingApprovalRequests as getPendingApprovalRequestsInStorage,
  updateApprovalRequest as updateApprovalRequestInStorage,
  generateRequestId as generateRequestIdInStorage,
} from "@/lib/storage/approvals-storage";
import type { ApprovalRequest } from "./models";

export async function createApprovalRequest(
  request: Omit<ApprovalRequest, "_id">
): Promise<ApprovalRequest> {
  return createApprovalRequestInStorage(request);
}

export async function getApprovalRequestById(requestId: string): Promise<ApprovalRequest | null> {
  return getApprovalRequestByIdInStorage(requestId);
}

export async function getApprovalRequestByEmail(email: string): Promise<ApprovalRequest | null> {
  const requests = await getAllApprovalRequestsInStorage();
  return (
    requests.find((r: any) => r.userEmail?.toLowerCase() === email.toLowerCase()) || null
  );
}

export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  return getPendingApprovalRequestsInStorage();
}

export async function getPendingPumpOwnerRequests(): Promise<ApprovalRequest[]> {
  const requests = await getPendingApprovalRequestsInStorage();
  return requests.filter((r: any) => r.requestType === "pump-owner");
}

export async function getPendingEmployeeRequests(): Promise<ApprovalRequest[]> {
  const requests = await getPendingApprovalRequestsInStorage();
  return requests.filter((r: any) => r.requestType === "employee");
}

export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  return getAllApprovalRequestsInStorage();
}

export async function approveApprovalRequest(
  requestId: string,
  approvedBy: string
): Promise<ApprovalRequest | null> {
  return updateApprovalRequestInStorage(requestId, {
    status: "approved",
    approvedAt: new Date(),
    approvedBy,
  });
}

export async function rejectApprovalRequest(
  requestId: string,
  approvedBy: string,
  reason?: string
): Promise<ApprovalRequest | null> {
  const updates: any = {
    status: "rejected",
    approvedBy,
  };
  if (reason) {
    updates.rejectionReason = reason;
  }
  return updateApprovalRequestInStorage(requestId, updates);
}

export async function generateRequestId(): Promise<string> {
  return generateRequestIdInStorage();
}

export async function initializeApprovalIndexes(): Promise<void> {
  // No-op for localStorage
}

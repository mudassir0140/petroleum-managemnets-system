"use server";

<<<<<<< HEAD
import { readJSON, writeJSON } from "./file-storage";

export interface ApprovalRequest {
  requestId: string;
  userEmail: string;
  requestType: "pump-owner" | "employee";
  role?: string;
  pumpId?: string;
  employeeId?: string;
  pumpName?: string;
  pumpOwnerName?: string;
  employeeName?: string;
  employeePhone?: string;
  city?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

const FILENAME = "approval-requests.json";

export async function createApprovalRequest(request: Omit<ApprovalRequest, "_id">): Promise<ApprovalRequest> {
  const requests = await getAllApprovalRequests();
  const now = new Date().toISOString();

  const newRequest: ApprovalRequest = {
    ...request,
    createdAt: typeof request.createdAt === "string" ? request.createdAt : now,
  };

  requests.push(newRequest);
  await writeJSON(FILENAME, requests);
  return newRequest;
}

export async function getApprovalRequestById(requestId: string): Promise<ApprovalRequest | null> {
  const requests = await getAllApprovalRequests();
  return requests.find((r) => r.requestId === requestId) || null;
}

export async function getApprovalRequestByEmail(email: string): Promise<ApprovalRequest | null> {
  const requests = await getAllApprovalRequests();
  return requests.find((r) => r.userEmail.toLowerCase() === email.toLowerCase()) || null;
}

export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  const requests = await getAllApprovalRequests();
  return requests.filter((r) => r.status === "pending");
}

export async function getPendingPumpOwnerRequests(): Promise<ApprovalRequest[]> {
  const requests = await getAllApprovalRequests();
  return requests.filter((r) => r.status === "pending" && r.requestType === "pump-owner");
}

export async function getPendingEmployeeRequests(): Promise<ApprovalRequest[]> {
  const requests = await getAllApprovalRequests();
  return requests.filter((r) => r.status === "pending" && r.requestType === "employee");
}

export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  return readJSON<ApprovalRequest>(FILENAME);
}

export async function approveApprovalRequest(requestId: string, approvedBy: string): Promise<ApprovalRequest | null> {
  const requests = await getAllApprovalRequests();
  const index = requests.findIndex((r) => r.requestId === requestId);

  if (index === -1) return null;

  const updated: ApprovalRequest = {
    ...requests[index],
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy,
  };

  requests[index] = updated;
  await writeJSON(FILENAME, requests);
  return updated;
=======
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
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

export async function rejectApprovalRequest(
  requestId: string,
  approvedBy: string,
  reason?: string
): Promise<ApprovalRequest | null> {
<<<<<<< HEAD
  const requests = await getAllApprovalRequests();
  const index = requests.findIndex((r) => r.requestId === requestId);

  if (index === -1) return null;

  const updated: ApprovalRequest = {
    ...requests[index],
=======
  const updates: any = {
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
    status: "rejected",
    approvedBy,
    rejectionReason: reason,
  };
<<<<<<< HEAD

  requests[index] = updated;
  await writeJSON(FILENAME, requests);
  return updated;
=======
  if (reason) {
    updates.rejectionReason = reason;
  }
  return updateApprovalRequestInStorage(requestId, updates);
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

export async function generateRequestId(): Promise<string> {
  return generateRequestIdInStorage();
}

export async function initializeApprovalIndexes(): Promise<void> {
<<<<<<< HEAD
  console.log("[FileStorage] Approval request file initialized");
=======
  // No-op for localStorage
>>>>>>> 2d242d75cdea8f65ba2668fa7f4b6a7ba774da3b
}

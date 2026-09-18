import { getStorageService } from "./localStorage-service";
import type { ApprovalRequest } from "@/lib/db/models";

const COLLECTION = "approval_requests";

export async function createApprovalRequest(
  request: Omit<ApprovalRequest, "_id">
): Promise<ApprovalRequest> {
  const service = getStorageService();
  const now = new Date();
  const requestData: any = {
    ...request,
    id: request.requestId,
    _id: request.requestId,
    createdAt: now.toISOString(),
  };

  service.create(COLLECTION, requestData);
  return requestData;
}

export async function getApprovalRequestById(
  requestId: string
): Promise<ApprovalRequest | null> {
  const service = getStorageService();
  const data = service.read(COLLECTION, requestId);
  return data ? (data as any) : null;
}

export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  const service = getStorageService();
  return service.readAll(COLLECTION) as any[];
}

export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  const service = getStorageService();
  return service.query(COLLECTION, (item: any) => item.status === "pending") as any[];
}

export async function updateApprovalRequest(
  requestId: string,
  updates: Partial<ApprovalRequest>
): Promise<ApprovalRequest | null> {
  const service = getStorageService();
  const updated = service.update(COLLECTION, requestId, updates);
  return updated ? (updated as any) : null;
}

export async function deleteApprovalRequest(requestId: string): Promise<boolean> {
  const service = getStorageService();
  return service.delete(COLLECTION, requestId);
}

export async function generateRequestId(): Promise<string> {
  return `REQ-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)
    .toUpperCase()}`;
}

export async function initializeApprovalIndexes(): Promise<void> {
  // No-op for localStorage
}

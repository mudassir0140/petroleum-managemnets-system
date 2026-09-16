"use server";

import { getDatabase } from "./mongodb";
import { ApprovalRequest } from "./models";

const COLLECTION_NAME = "approval_requests";

export async function createApprovalRequest(request: Omit<ApprovalRequest, "_id">): Promise<ApprovalRequest> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);

  const now = new Date();
  const newRequest: ApprovalRequest = {
    ...request,
    createdAt: now,
  };

  const result = await collection.insertOne(newRequest);
  return { ...newRequest, _id: result.insertedId };
}

export async function getApprovalRequestById(requestId: string): Promise<ApprovalRequest | null> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.findOne({ requestId });
}

export async function getApprovalRequestByEmail(email: string): Promise<ApprovalRequest | null> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.findOne({ userEmail: { $regex: `^${email}$`, $options: "i" } });
}

export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.find({ status: "pending" }).toArray();
}

export async function getPendingPumpOwnerRequests(): Promise<ApprovalRequest[]> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.find({ status: "pending", requestType: "pump-owner" }).toArray();
}

export async function getPendingEmployeeRequests(): Promise<ApprovalRequest[]> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.find({ status: "pending", requestType: "employee" }).toArray();
}

export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);
  return collection.find({}).toArray();
}

export async function approveApprovalRequest(
  requestId: string,
  approvedBy: string
): Promise<ApprovalRequest | null> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);

  const result = await collection.findOneAndUpdate(
    { requestId },
    {
      $set: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy,
      },
    },
    { returnDocument: "after" }
  );

  return (result as any)?.value || null;
}

export async function rejectApprovalRequest(
  requestId: string,
  approvedBy: string,
  reason?: string
): Promise<ApprovalRequest | null> {
  const db = await getDatabase();
  const collection = db.collection<ApprovalRequest>(COLLECTION_NAME);

  const updates: any = {
    status: "rejected",
    approvedBy,
  };

  if (reason) {
    updates.rejectionReason = reason;
  }

  const result = await collection.findOneAndUpdate(
    { requestId },
    { $set: updates },
    { returnDocument: "after" }
  );

  return (result as any)?.value || null;
}

export async function generateRequestId(): Promise<string> {
  return `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function initializeApprovalIndexes(): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  await collection.createIndex({ requestId: 1 }, { unique: true });
  await collection.createIndex({ userEmail: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ requestType: 1 });
  console.log("[MongoDB] Approval request indexes initialized");
}

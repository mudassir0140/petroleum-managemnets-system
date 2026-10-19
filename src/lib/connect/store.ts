import type { Db, Document, ObjectId } from "mongodb";
import type { RequestStatus } from "./rules";

// The pump-to-pump requests already stored by the request flow, and the chat messages stored by this feature.
export const REQUESTS = "pump_friend_requests";
export const MESSAGES = "connect_messages";

// Every request between two pumps, in either direction, as a status list. Empty when they have never asked.
export async function requestStatusesBetween(db: Db, a: ObjectId, b: ObjectId): Promise<RequestStatus[]> {
  const docs = await db
    .collection(REQUESTS)
    .find({ $or: [{ senderId: a, receiverId: b }, { senderId: b, receiverId: a }] }, { projection: { status: 1 } })
    .toArray();
  return docs.map((d) => d.status as RequestStatus);
}

// Chat messages of one conversation, oldest first, up to the most recent 200.
export async function listMessages(db: Db, conversationKey: string): Promise<Document[]> {
  const docs = await db
    .collection(MESSAGES)
    .find({ conversationKey })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return docs.reverse();
}

// Saves one message and returns it. The conversation index is created once and is harmless to repeat.
export async function saveMessage(db: Db, doc: Document): Promise<Document> {
  const messages = db.collection(MESSAGES);
  await messages.createIndex({ conversationKey: 1, createdAt: 1 });
  const result = await messages.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

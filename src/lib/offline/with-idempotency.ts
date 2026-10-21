import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { idempotent, STALE_CLAIM_MS, type AnswerStore, type SavedAnswer } from "./idempotency";
import { isFinalAnswer } from "./rules";

// Kept answers are removed after a week. The collection only holds answers for changes sent from offline queues.
const COLLECTION = "offline_answers";
const KEEP_SECONDS = 7 * 24 * 60 * 60;

interface AnswerDoc {
  _id: string;
  state: "running" | "done";
  createdAt: Date;
  answer?: SavedAnswer;
}

let indexReady: Promise<unknown> | null = null;

async function answers() {
  const db = await getDatabase();
  const collection = db.collection<AnswerDoc>(COLLECTION);
  // Created once per process. If it fails, the next request tries again.
  indexReady ??= collection
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: KEEP_SECONDS })
    .catch((error) => {
      indexReady = null;
      throw error;
    });
  await indexReady;
  return collection;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

const mongoAnswerStore: AnswerStore = {
  async claim(id, now) {
    const collection = await answers();
    try {
      await collection.insertOne({ _id: id, state: "running", createdAt: new Date(now) });
      return { state: "claimed" };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }

    // A claim left running for too long is taken over, so the retry is not blocked forever.
    const stale = new Date(now - STALE_CLAIM_MS);
    const taken = await collection.updateOne(
      { _id: id, state: "running", createdAt: { $lt: stale } },
      { $set: { createdAt: new Date(now) } }
    );
    if (taken.matchedCount === 1) return { state: "claimed" };

    const existing = await collection.findOne({ _id: id });
    if (existing?.state === "done" && existing.answer) return { state: "done", answer: existing.answer };
    return { state: "running" };
  },

  async complete(id, answer) {
    const collection = await answers();
    await collection.updateOne({ _id: id }, { $set: { state: "done", answer, createdAt: new Date() } });
  },

  async release(id) {
    const collection = await answers();
    await collection.deleteOne({ _id: id, state: "running" });
  },
};

// Wraps a POST route so that a request carrying an Idempotency-Key is saved once. Requests without a key are
// unchanged, so the online app behaves exactly as before.
export function withIdempotency<Ctx = unknown>(
  handler: (request: NextRequest, context: Ctx) => Promise<Response>
): (request: NextRequest, context: Ctx) => Promise<Response> {
  return idempotent(mongoAnswerStore, handler, isFinalAnswer);
}

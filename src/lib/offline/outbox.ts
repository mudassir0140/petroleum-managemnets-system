"use client";

// The offline outbox: changes that could not reach the server are kept in IndexedDB and sent again, in order, when
// the connection returns. Each queued change carries one Idempotency-Key, created once and reused on every retry,
// so the server stores it once even if an earlier attempt did reach it.
import { isQueueable, outcomeFor, retryDelayMs } from "./rules";

const DB_NAME = "pms-offline";
const STORE = "outbox";
const CHANGED = "pms-outbox-changed";

export interface OutboxItem {
  id: string;
  url: string;
  method: string;
  contentType: string;
  body: string;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  status: "pending" | "sign-in" | "failed";
  lastError: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function announce() {
  window.dispatchEvent(new Event(CHANGED));
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const items = await withStore<OutboxItem[]>("readonly", (store) => store.getAll());
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

async function putItem(item: OutboxItem): Promise<void> {
  await withStore("readwrite", (store) => store.put(item));
  announce();
}

async function deleteItem(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
  announce();
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// A fetch for a change. If the server answers, the answer is returned as it is. If the connection fails before an
// answer, a queueable change is saved in IndexedDB and a 202 "queued" answer is returned instead.
export async function offlineFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const path = new URL(url, window.location.origin).pathname;
  const id = newId();
  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", id);

  try {
    return await fetch(url, { ...init, method, headers, credentials: "same-origin", cache: "no-store" });
  } catch (error) {
    if (!isQueueable(method, path) || typeof init.body !== "string") throw error;
    await putItem({
      id,
      url,
      method,
      contentType: headers.get("Content-Type") ?? "application/json",
      body: init.body,
      createdAt: Date.now(),
      attempts: 0,
      nextAttemptAt: 0,
      status: "pending",
      lastError: "",
    });
    return new Response(JSON.stringify({ queued: true, offlineId: id }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }
}

let running = false;

// Sends the queued changes in order. Stops at the first connection failure or missing session, so later changes are
// not sent out of order. A failed change stays in the outbox for review.
export async function syncOutbox(): Promise<void> {
  if (running || typeof window === "undefined") return;
  running = true;
  try {
    const items = await listOutbox();
    for (const item of items) {
      if (item.status === "failed" || item.nextAttemptAt > Date.now()) continue;
      let outcome: ReturnType<typeof outcomeFor>;
      let body: { error?: string } = {};
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": item.contentType, "Idempotency-Key": item.id },
          body: item.body,
          credentials: "same-origin",
          cache: "no-store",
        });
        outcome = outcomeFor(response.status);
        body = await response.json().catch(() => ({}));
        if (outcome === "done") {
          await deleteItem(item.id);
          continue;
        }
        if (outcome === "failed") {
          await putItem({ ...item, status: "failed", attempts: item.attempts + 1, lastError: body.error || `Server answered ${response.status}` });
          continue;
        }
      } catch {
        outcome = "retry";
      }

      const attempts = item.attempts + 1;
      if (outcome === "sign-in") {
        await putItem({ ...item, status: "sign-in", attempts, nextAttemptAt: Date.now() + 60_000, lastError: "Sign in again to send this change" });
      } else {
        await putItem({ ...item, status: "pending", attempts, nextAttemptAt: Date.now() + retryDelayMs(attempts), lastError: body.error || "Waiting for the connection" });
      }
      // Later changes wait behind this one, so they are not sent out of order.
      break;
    }
  } finally {
    running = false;
  }
}

export const OUTBOX_EVENT = CHANGED;

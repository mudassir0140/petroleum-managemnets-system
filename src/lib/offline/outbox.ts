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
  kind?: "json" | "form";
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
    const isForm = init.body instanceof FormData;
    // A request with no body (a notification read mark) is queued with an empty body.
    if (!isQueueable(method, path)) throw error;
    if (!isForm && init.body !== undefined && typeof init.body !== "string") throw error;
    const body = isForm ? await serializeForm(init.body as FormData) : ((init.body as string | undefined) ?? "");
    await putItem({
      id,
      url,
      method,
      kind: isForm ? "form" : "json",
      contentType: isForm ? "multipart/form-data" : (headers.get("Content-Type") ?? "application/json"),
      body,
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
          headers: item.kind === "form" ? { "Idempotency-Key": item.id } : { "Content-Type": item.contentType, "Idempotency-Key": item.id },
          body: item.kind === "form" ? deserializeForm(item.body) : item.body,
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

// A photo is kept in the queue with the form it belongs to. The limit keeps the queue well inside browser storage;
// a larger form is refused at the time it is saved, so nothing is lost silently.
const MAX_FORM_CHARS = 8 * 1024 * 1024;

type FormPart = { name: string; value: string } | { name: string; file: { name: string; type: string; data: string } };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(data: string): Uint8Array<ArrayBuffer> {
  const binary = atob(data);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function serializeForm(form: FormData): Promise<string> {
  const parts: FormPart[] = [];
  for (const [name, value] of form.entries()) {
    if (typeof value === "string") {
      parts.push({ name, value });
    } else {
      parts.push({ name, file: { name: value.name, type: value.type, data: toBase64(new Uint8Array(await value.arrayBuffer())) } });
    }
  }
  const json = JSON.stringify(parts);
  if (json.length > MAX_FORM_CHARS) {
    throw new Error("This photo is too large to save on this device. Retake it with a smaller photo, or try again when the internet is back.");
  }
  return json;
}

export function deserializeForm(body: string): FormData {
  const form = new FormData();
  for (const part of JSON.parse(body) as FormPart[]) {
    if ("file" in part) {
      form.append(part.name, new File([fromBase64(part.file.data)], part.file.name, { type: part.file.type }));
    } else {
      form.append(part.name, part.value);
    }
  }
  return form;
}

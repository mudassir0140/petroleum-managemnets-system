"use client";

// The offline outbox. A queueable change that cannot reach the server is kept in IndexedDB and sent again, in order,
// when the connection returns. Each change keeps one Idempotency-Key, created once and reused on every retry, so the
// server saves it once even if an earlier attempt did reach it.
//
// A change is sent only under the account that made it: each change stores the account scope (see scope.ts) that
// was current when it was made, and waits until that same account is signed in again.
import { isQueueable, outcomeFor, PAYMENT_TOKEN, queuedPathname, retryDelayMs } from "./rules";

const DB_NAME = "pms-offline";
const STORE = "outbox";
const SCOPE_KEY = "pms-offline-scope";
export const OUTBOX_EVENT = "pms-outbox-changed";
const SYNC_LOCK = "pms-outbox-sync";

export type StoredBody =
  | { kind: "text"; contentType: string; text: string }
  | { kind: "form"; fields: { name: string; value: string | File }[] };

export interface OutboxItem {
  id: string;
  url: string;
  method: string;
  scope: string;
  body: StoredBody;
  // Set on a proof image whose payment is still queued: the id of that payment's change. It is sent only after the
  // payment is saved, and its URL gets the saved payment id (see resolveAfter).
  after?: string;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  // pending: will be sent. sign-in: waits for its account. failed: refused by the server, kept for review.
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
  window.dispatchEvent(new Event(OUTBOX_EVENT));
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

// Removes a change the person chose to discard after the server refused it.
export async function discardOutboxItem(id: string): Promise<void> {
  await deleteItem(id);
}

function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// The account scope last reported by the server. "" means signed out. null means never checked on this device.
export function readScope(): string | null {
  try {
    return window.localStorage.getItem(SCOPE_KEY);
  } catch {
    return null;
  }
}

function rememberScope(scope: string) {
  try {
    window.localStorage.setItem(SCOPE_KEY, scope);
  } catch {
    // Without storage no change can be queued (see offlineFetch), so nothing else is lost.
  }
}

// Asks the server which account this browser is signed in as. Returns null when the server cannot be reached.
// When the account changes, the offline page and data caches are cleared so one account never sees another's data.
export async function refreshScope(): Promise<string | null> {
  let scope: string;
  try {
    const response = await fetch("/api/offline/scope", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return null;
    scope = (await response.json()).scope;
    if (typeof scope !== "string") return null;
  } catch {
    return null;
  }
  const previous = readScope();
  if (previous !== scope) {
    rememberScope(scope);
    if (previous !== null) clearOfflineData();
  }
  return scope;
}

// Clears the cached pages and API data. Called when the account changes and on sign-in pages.
export function clearOfflineData(): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: "clear-data" });
}

function bodyFor(body: BodyInit | null | undefined, headers: Headers): StoredBody | null {
  if (typeof body === "string") {
    return { kind: "text", contentType: headers.get("Content-Type") ?? "application/json", text: body };
  }
  if (body instanceof FormData) {
    const fields: { name: string; value: string | File }[] = [];
    body.forEach((value, name) => fields.push({ name, value }));
    return { kind: "form", fields };
  }
  return null;
}

function bodyToSend(body: StoredBody): { body: BodyInit; contentType?: string } {
  if (body.kind === "text") return { body: body.text, contentType: body.contentType };
  const form = new FormData();
  for (const field of body.fields) form.append(field.name, field.value);
  return { body: form };
}

function queuedAnswer(id: string): Response {
  return new Response(JSON.stringify({ queued: true, offlineId: id }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

// Saves a change in the outbox. Returns null when the change cannot be saved (no account scope, or a body that cannot
// be stored), so the caller can report the original error.
async function enqueue(
  item: Pick<OutboxItem, "id" | "url" | "method" | "after"> & { init: RequestInit }
): Promise<Response | null> {
  const headers = new Headers(item.init.headers);
  const body = bodyFor(item.init.body, headers);
  const scope = readScope();
  // No queue without an account: a change made by no one could never be matched to a sign-in.
  if (!body || !scope) return null;

  await putItem({
    id: item.id,
    url: item.url,
    method: item.method,
    scope,
    body,
    after: item.after,
    createdAt: Date.now(),
    attempts: 0,
    nextAttemptAt: 0,
    status: "pending",
    lastError: "",
  });
  return queuedAnswer(item.id);
}

// A fetch for a queueable change. A change that gets an answer from the server is returned as it is. If the
// connection fails before an answer, the change is saved in IndexedDB and a 202 "queued" answer is returned instead.
// `after` (a proof image) is always saved, and sent once the change named by `after` has been saved.
// Other requests are sent unchanged.
export async function offlineFetch(
  url: string,
  init: RequestInit = {},
  options: { after?: string } = {}
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  if (!isQueueable(method, queuedPathname(url))) return fetch(url, init);

  const id = newId();
  if (options.after) {
    const saved = await enqueue({ id, url, method, after: options.after, init });
    if (!saved) throw new Error("This change could not be saved on this device");
    return saved;
  }

  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", id);
  const sent: RequestInit = { ...init, method, headers, credentials: "same-origin", cache: "no-store" };

  try {
    return await fetch(url, sent);
  } catch (error) {
    const saved = await enqueue({ id, url, method, init: { ...init, headers } });
    if (!saved) throw error;
    return saved;
  }
}

// The payment with this outbox id has been saved as `paymentId`. Proof images that waited for it get the real id, both
// in storage and in the list being synced, so they are sent in this same pass.
async function resolveAfter(items: OutboxItem[], changeId: string, paymentId: string): Promise<void> {
  for (const waiting of items.filter((item) => item.after === changeId)) {
    waiting.url = waiting.url.split(PAYMENT_TOKEN).join(paymentId);
    waiting.after = undefined;
    await putItem(waiting);
  }
}

// Only one sync runs at a time, across tabs where the browser supports Web Locks.
async function exclusively(run: () => Promise<void>): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request(SYNC_LOCK, run);
  } else {
    await run();
  }
}

// Sends the queued changes in order. Stops at the first connection failure or retryable answer, so later changes
// are not sent ahead of it. A change from another account waits. A change the server refused stays for review.
export async function syncOutbox(): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  await exclusively(async () => {
    const scope = await refreshScope();
    if (scope === null) return;

    const items = await listOutbox();
    for (const item of items) {
      // A proof waits for its payment. The payment is earlier in this list, so it has already been saved here.
      if (item.after || item.status === "failed" || item.nextAttemptAt > Date.now()) continue;

      if (item.scope !== scope) {
        if (item.status !== "sign-in") {
          await putItem({ ...item, status: "sign-in", lastError: "Sign in to the account that made this change to send it" });
        }
        continue;
      }

      const attempts = item.attempts + 1;
      const sendable = bodyToSend(item.body);
      const headers = new Headers({ "Idempotency-Key": item.id });
      if (sendable.contentType) headers.set("Content-Type", sendable.contentType);

      let response: Response;
      try {
        response = await fetch(item.url, {
          method: item.method,
          headers,
          body: sendable.body,
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {
        await putItem({ ...item, attempts, nextAttemptAt: Date.now() + retryDelayMs(attempts), lastError: "Waiting for the connection" });
        break;
      }

      const outcome = outcomeFor(response.status);
      const answer: { error?: unknown; paymentId?: unknown } = await response.json().catch(() => ({}));
      if (outcome === "done") {
        if (typeof answer.paymentId === "string") await resolveAfter(items, item.id, answer.paymentId);
        await deleteItem(item.id);
        continue;
      }

      const message = typeof answer.error === "string" ? answer.error : `Server answered ${response.status}`;

      if (outcome === "failed") {
        await putItem({ ...item, status: "failed", attempts, lastError: message });
        continue;
      }
      if (outcome === "sign-in") {
        await putItem({ ...item, status: "sign-in", attempts, nextAttemptAt: Date.now() + 60_000, lastError: "Sign in to send this change" });
        continue;
      }
      // Retryable: later changes wait behind this one, so they are not sent out of order.
      await putItem({ ...item, status: "pending", attempts, nextAttemptAt: Date.now() + retryDelayMs(attempts), lastError: message });
      break;
    }
  });
}

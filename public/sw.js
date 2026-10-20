// Offline cache and background sync for the Petroleum Management System.
// - Build files (/_next/static) are cached on first use and never change, so they are served from the cache.
// - Pages the user has opened are kept, and served when the network is down.
// - The read data of every page is kept, so pages show their last synced values offline.
// - Changes are never answered from the cache: only GET requests are cached. Queued changes are sent from the
//   outbox in IndexedDB, by the page or by this worker (background sync, or a message from the offline page).
// - The page and data caches are removed when a sign-in page loads (see OfflineProvider).
const VERSION = "pms-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const OFFLINE_PAGE = "/offline.html";
const SYNC_TAG = "pms-outbox";
const OUTBOX_DB = "pms-offline";
const OUTBOX_STORE = "outbox";

self.addEventListener("install", (event) => {
  // If the offline page cannot be fetched now (for example, the install happens while offline), the worker still
  // installs. Without it, the worker never takes control and every offline navigation ends in the browser's own error.
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_PAGE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "clear-caches") {
    event.waitUntil(clearPersonalCache());
  }
  if (event.data.type === "flush-outbox") {
    event.waitUntil(flushOutbox());
  }
});

// The browser calls this when it is online again, even if no app page is open.
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushOutbox());
});

// Sign-in pages hold no personal data, so they stay available offline. Every other page and all read data are removed.
const SIGN_IN_PAGE = /^\/(auth\/login|login|developer|pump-owner\/login|khata-client\/login)(\/|$)/;

async function clearPersonalCache() {
  await caches.delete(DATA_CACHE);
  const pages = await caches.open(PAGE_CACHE);
  for (const request of await pages.keys()) {
    if (!SIGN_IN_PAGE.test(new URL(request.url).pathname)) await pages.delete(request);
  }
}

// The read data of every page is kept. Sign-in, sign-out, live location, account changes and secret reveal are not.
function isCachedData(pathname) {
  if (/\/auth\/|\/logout|\/location|\/reveal|\/api\/account\//.test(pathname)) return false;
  return pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    if (isCachedData(url.pathname)) event.respondWith(networkFirst(event, request, DATA_CACHE, false));
    return;
  }

  // A full page load, or the in-app navigation Next.js does (RSC requests).
  if (request.mode === "navigate" || request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(event, request, PAGE_CACHE, true));
  }
});

async function cacheFirst(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") event.waitUntil(cache.put(request, response.clone()));
  return response;
}

// Next.js asks for a page's RSC payload when the person moves between pages inside the app. It is kept under its own
// key, so it never replaces the page's HTML, which a full load (or a reload while offline) needs.
function storageKey(request) {
  if (request.headers.get("RSC") !== "1") return request;
  const url = new URL(request.url);
  url.searchParams.set("__rsc", "1");
  return new Request(url.href);
}

// The stored copy drops Vary, so the page is found for any later request for the same URL, not only for requests with
// the same headers as the one it was first answered for.
async function storedCopy(response) {
  const headers = new Headers(response.headers);
  headers.delete("Vary");
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}

// Shown only when the offline page itself was never cached (for example, the worker was installed while offline), so a
// navigation never ends in the browser's own "no internet" page.
function builtInOfflinePage() {
  const html =
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title>' +
    "<body style=\"font-family:system-ui,sans-serif;padding:24px\"><h1>You are offline</h1>" +
    "<p>Pages you opened while online are available here once they were saved. Changes are kept on this device and sent when the internet returns.</p></body></html>";
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function networkFirst(event, request, cacheName, isPage) {
  const cache = await caches.open(cacheName);
  const key = storageKey(request);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      // Written before the worker can stop, so the page is kept even when the answer is read after the response
      event.waitUntil(storedCopy(response.clone()).then((stored) => cache.put(key, stored)).catch(() => undefined));
    }
    return response;
  } catch {
    const hit = await cache.match(key);
    if (hit) return hit;
    if (isPage) {
      const offline = await caches.match(OFFLINE_PAGE);
      return offline || builtInOfflinePage();
    }
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

// ---- Outbox sync, run by the worker. The rules below match src/lib/offline/rules.ts and src/lib/offline/outbox.ts:
// change them in both places together.

function outcomeFor(status) {
  if (status >= 200 && status < 300) return "done";
  if (status === 401 || status === 403) return "sign-in";
  if (status === 408 || status === 429 || status >= 500) return "retry";
  return "failed";
}

function retryDelayMs(attempts) {
  return Math.min(5000 * 2 ** Math.min(attempts, 10), 5 * 60000);
}

function fromBase64(data) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function deserializeForm(body) {
  const form = new FormData();
  for (const part of JSON.parse(body)) {
    if ("file" in part) {
      form.append(part.name, new File([fromBase64(part.file.data)], part.file.name, { type: part.file.type }));
    } else {
      form.append(part.name, part.value);
    }
  }
  return form;
}

function openOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function outboxAll(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(OUTBOX_STORE).objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function outboxWrite(db, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function outboxRemove(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// The same lock name as the page uses (src/lib/offline/outbox.ts), so the page and this worker never send the queue at
// the same time. A send with no answer after the timeout is given up and retried later.
const FLUSH_LOCK = "pms-outbox-flush";
const SEND_TIMEOUT_MS = 60000;

function flushOutbox() {
  if (!navigator.locks) return flushQueue();
  return navigator.locks.request(FLUSH_LOCK, flushQueue);
}

// The headers for one send: the same Idempotency-Key on every try, and the time the person made the change.
function sendHeaders(item) {
  const clientTime = item.clientTime || new Date(item.createdAt).toISOString();
  const common = { "Idempotency-Key": item.id, "X-Client-Time": clientTime };
  return item.kind === "form" ? common : { "Content-Type": item.contentType, ...common };
}

// Sends the queued changes in order, like the page does. Stops at the first connection failure or missing session.
async function flushQueue() {
  const db = await openOutbox();
  try {
    const items = (await outboxAll(db)).sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      if (item.status === "failed" || item.nextAttemptAt > Date.now()) continue;
      let outcome;
      let body = {};
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: sendHeaders(item),
          body: item.kind === "form" ? deserializeForm(item.body) : item.body,
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        });
        outcome = outcomeFor(response.status);
        body = await response.json().catch(() => ({}));
        if (outcome === "done") {
          await outboxRemove(db, item.id);
          continue;
        }
        if (outcome === "failed") {
          await outboxWrite(db, { ...item, status: "failed", attempts: item.attempts + 1, lastError: body.error || `Server answered ${response.status}` });
          continue;
        }
      } catch {
        outcome = "retry";
      }

      const attempts = item.attempts + 1;
      if (outcome === "sign-in") {
        await outboxWrite(db, { ...item, status: "sign-in", attempts, nextAttemptAt: Date.now() + 60000, lastError: "Sign in again to send this change" });
      } else {
        await outboxWrite(db, { ...item, status: "pending", attempts, nextAttemptAt: Date.now() + retryDelayMs(attempts), lastError: body.error || "Waiting for the connection" });
      }
      break;
    }
  } finally {
    db.close();
  }
}

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
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_PAGE))
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
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    if (isCachedData(url.pathname)) event.respondWith(networkFirst(request, DATA_CACHE, false));
    return;
  }

  // A full page load, or the in-app navigation Next.js does (RSC requests).
  if (request.mode === "navigate" || request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request, PAGE_CACHE, true));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, isPage) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    if (isPage) {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
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

// Sends the queued changes in order, like the page does. Stops at the first connection failure or missing session.
async function flushOutbox() {
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
          headers: item.kind === "form" ? { "Idempotency-Key": item.id } : { "Content-Type": item.contentType, "Idempotency-Key": item.id },
          body: item.kind === "form" ? deserializeForm(item.body) : item.body,
          credentials: "same-origin",
          cache: "no-store",
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

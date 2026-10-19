// Offline cache for the Petroleum Management System.
// - Build files (/_next/static) are cached on first use and never change, so they are served from the cache.
// - Pages the user has opened are kept, and served when the network is down.
// - The khata read data is kept, so the khata screens show their last synced values offline.
// - Changes are never answered from the cache: only GET requests are cached, and queued changes are sent by the page.
// - The page and data caches are removed when a sign-in page loads (see OfflineProvider).
const VERSION = "pms-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const OFFLINE_PAGE = "/offline.html";

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
  if (event.data && event.data.type === "clear-caches") {
    event.waitUntil(Promise.all([caches.delete(PAGE_CACHE), caches.delete(DATA_CACHE)]));
  }
});

// The read data of every page is kept, so pages show their last synced data offline. Sign-in, sign-out, live
// location, account changes and secret reveal are never kept.
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

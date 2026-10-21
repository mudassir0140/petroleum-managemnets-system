// Offline cache for the Petroleum Management System.
// - Build files, icons and the offline page are cached and served from the cache first (they never change per URL).
// - Pages the person has opened are kept, and served when the network is down. Next's RSC requests are kept too.
// - Read data from the module APIs (sales, khata, shifts, fuel orders, employees, reports and the dashboard figures)
//   is kept, and served when the network is down. Only GET requests are kept; changes are never answered from the
//   cache: the page queues them and sends them again (see src/lib/offline/outbox.ts).
// - All caches are removed when a sign-in page loads or the signed-in account changes (the page sends "clear-data").
const VERSION = "pms-offline-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const DATA_CACHE = `${VERSION}-data`;
const OFFLINE_PAGE = "/offline.html";
const STATIC_ASSETS = [OFFLINE_PAGE, "/logo/logo.png", "/icons/icon-192.png", "/icons/icon-512.png"];
const MAX_ENTRIES = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
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
  if (event.data && event.data.type === "clear-data") {
    event.waitUntil(Promise.all([caches.delete(PAGE_CACHE), caches.delete(DATA_CACHE)]));
  }
});

// Module read endpoints that may be kept. Only these are cached, so an endpoint that returns credentials (password
// hashes, reveal, username lists, admin account lists) is never kept. Add an endpoint here only after checking that
// its GET response holds no credentials.
const CACHED_API = [
  /^\/api\/pump-owner\/(sales|fuel-orders)$/, // sales, fuel orders
  /^\/api\/attendant\/(shifts|khata-accounts|khata-entries|rates)$/, // shifts, khata
  /^\/api\/khata\/(clients|clients\/[a-f0-9]{24}|accounts|entries|payments|transactions|months|audit|client\/payments)$/, // khata, payments
  /^\/api\/khata\/attachments\/[a-f0-9]{24}$/, // payment proof images
  /^\/api\/pumpadmin\/(shifts|summary|fuel-rates|fuel-requests|employees|employees\/[a-f0-9]{24}|employees\/[a-f0-9]{24}\/attendance)$/, // dashboard, employees, fuel orders
  /^\/api\/admin\/(payments|orders)$/, // payments, fuel orders
  /^\/api\/fuel-price$/, // dashboard figures
  /^\/api\/pump-info$/,
];

function isCachedApi(pathname) {
  return CACHED_API.some((pattern) => pattern.test(pathname));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image") || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    if (isCachedApi(url.pathname)) event.respondWith(networkFirst(request, DATA_CACHE, false));
    return;
  }

  // A full page load, or the in-app navigation Next.js does (RSC requests, which carry the RSC header).
  if (request.mode === "navigate" || request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request, PAGE_CACHE, true));
  }
});

// Next.js adds a changing _rsc value to its requests. It is removed from the key so the same page is found again.
// RSC payloads and HTML pages for one URL are kept apart.
function cacheKey(request) {
  const url = new URL(request.url);
  url.searchParams.delete("_rsc");
  if (request.headers.get("RSC") === "1") url.searchParams.set("__kind", "rsc");
  return new Request(url.toString());
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(cacheKey(request));
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") await store(cache, cacheKey(request), response.clone());
  return response;
}

async function networkFirst(request, cacheName, isPage) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await store(cache, cacheKey(request), response.clone());
    return response;
  } catch {
    const hit = await cache.match(cacheKey(request));
    if (hit) return hit;
    if (isPage) {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
    }
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

// Keeps the cache from growing without limit: the oldest entries go first.
async function store(cache, key, response) {
  await cache.put(key, response);
  const keys = await cache.keys();
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) {
    await cache.delete(old);
  }
}

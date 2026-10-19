// Browser test: the service worker installs, controls the page, serves cached pages offline, and shows the offline page
// for pages that were never opened. Runs against the production build. Uses Microsoft Edge, already on this PC.
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));

const BASE = process.env.BASE_URL || "http://localhost:3110";
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Install and take control
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const registered = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active ? reg.active.state : "none";
  });
  check("service worker installed and active", registered === "activated", registered);

  await page.reload({ waitUntil: "networkidle" });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  check("service worker controls the page after reload", controlled);

  // Visit a second public page while online so it is cached
  await page.goto(`${BASE}/khata-client/login`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });

  // 2. Build files and the offline page are cached
  const cacheNames = await page.evaluate(() => caches.keys());
  check("static cache exists", cacheNames.some((n) => n.startsWith("pms-v1-static")), cacheNames.join(", "));
  const offlinePageCached = await page.evaluate(async () => {
    const cache = await caches.open(cacheNames0());
    return Boolean(await cache.match("/offline.html"));
    function cacheNames0() {
      return "pms-v1-static";
    }
  });
  check("offline page is cached", offlinePageCached);

  // 3. Offline: a page that was opened online still loads
  await context.setOffline(true);
  const offlineResponse = await page.goto(`${BASE}/auth/login`, { waitUntil: "domcontentloaded" });
  const bodyOffline = await page.content();
  check(
    "offline: the login page loads (from cache, or the offline page after a sign-in page clears the cache)",
    offlineResponse !== null && bodyOffline.length > 200,
    bodyOffline.includes("You are offline") ? "served the offline page" : "served the cached page"
  );

  // 4. Offline: a page never opened online shows the offline page, not a browser error
  await page.goto(`${BASE}/pumpadmin/attendance-never-opened`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
  const neverOpened = await page.content();
  check("offline: an unopened page shows the offline page", neverOpened.includes("You are offline"));

  // 5. Back online: the page loads normally
  await context.setOffline(false);
  await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
  const backOnline = await page.content();
  check("online again: the login page loads normally", backOnline.includes("<html") && !backOnline.includes("You are offline"));

  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error("TEST CRASHED:", error);
  process.exit(2);
});

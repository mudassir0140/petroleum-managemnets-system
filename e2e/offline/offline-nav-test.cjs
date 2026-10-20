// Browser test of offline navigation on the production build. With the network disabled, a page the person opened
// online must load from the device, a page never opened must show the app's offline page, and Chrome's own
// "no internet" error page (DNS_PROBE_FINISHED_NO_INTERNET, ERR_INTERNET_DISCONNECTED) must never appear once the
// worker controls the site. Also checks that an in-app (RSC) navigation does not replace the page's cached HTML.
// Run: node offline-nav-test.cjs   (needs a built app, Microsoft Edge, and MongoDB on MONGO_URI)
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));

const APP_DIR = process.env.APP_DIR || path.resolve(__dirname, "../..");
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const PORT = Number(process.env.NAV_PORT) || 3370;
const BASE = `http://localhost:${PORT}`;

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

// Starts the production server on this test's own port. A server already on the port is refused, not reused.
async function startServer() {
  try {
    if ((await fetch(`${BASE}/auth/login`)).ok) throw new Error(`port ${PORT} is already in use: stop the old server first`);
  } catch (error) {
    if (String(error.message).startsWith("port ")) throw error;
  }
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: APP_DIR,
    env: { ...process.env, MONGODB_URI: MONGO_URI, MONGODB_DB: "pms_nav" },
    shell: true,
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/auth/login`)).ok) return child;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server did not start");
}

// Navigates with the network off. Resolves to the page text, or to the browser's own error text.
async function offlineGo(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    return { error: null, text: (await page.locator("body").innerText()).trim(), html: await page.content() };
  } catch (error) {
    return { error: error.message.split("\n")[0], text: "", html: "" };
  }
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // First visit online. The worker takes control on the reload that follows its first activation.
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const registration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return { active: reg?.active?.state ?? null, scope: reg?.scope ?? null, controlled: Boolean(navigator.serviceWorker.controller) };
    });
    check("worker: registered, activated and controlling the page", registration.active === "activated" && registration.controlled, `state ${registration.active}`);
    check("worker: scope covers the whole site (HTTPS-style root scope)", registration.scope === `${BASE}/`, registration.scope);

    // An in-app navigation: Next.js asks for the page's RSC payload, not its HTML
    const rscStatus = await page.evaluate(async (path) => (await fetch(path, { headers: { RSC: "1" } })).status, "/auth/login");
    await page.waitForTimeout(800);

    // Network off: the page opened online must come from the device
    await context.setOffline(true);
    const visited = await offlineGo(page, `${BASE}/auth/login`);
    check("offline: a page opened online loads from the device", !visited.error && visited.html.includes('type="password"'), visited.error || `${visited.text.length} characters`);
    check("offline: that page is the real page, not the offline page", !visited.text.includes("You are offline"));

    // The same page after the in-app request above (rscStatus was 200 online)
    check("offline: after an in-app navigation the page still loads from the device", rscStatus === 200 && !visited.error && visited.html.includes('type="password"'), `rsc status ${rscStatus}`);

    // A page never opened: the app's offline page, not Chrome's error page
    const unseen = await offlineGo(page, `${BASE}/pumpadmin/never-opened-offline-test`);
    check("offline: a page never opened shows the app's offline page", !unseen.error && unseen.text.includes("You are offline"), unseen.error || "");
    check("offline: Chrome's no-internet page is never shown", !unseen.error && !visited.error, unseen.error || visited.error || "");

    await context.setOffline(false);
    await context.close();

    // The worker installs while the offline page cannot be fetched (the install fails to cache it). It must still take
    // control, or every offline navigation ends in the browser's own error page.
    const blocked = await browser.newContext();
    await blocked.route("**/offline.html", (route) => route.abort());
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
    await blockedPage.waitForTimeout(3000);
    await blockedPage.reload({ waitUntil: "networkidle" });
    await blockedPage.waitForTimeout(1000);
    const blockedState = await blockedPage.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return { active: reg?.active?.state ?? null, controlled: Boolean(navigator.serviceWorker.controller) };
    });
    check("install without the offline page: the worker still activates and controls the site", blockedState.active === "activated" && blockedState.controlled, `state ${blockedState.active}`);
    await blocked.unroute("**/offline.html");
    await blocked.setOffline(true);
    const unseenBlocked = await offlineGo(blockedPage, `${BASE}/pumpadmin/never-opened-blocked-test`);
    check("install without the offline page: an unopened page shows the built-in offline page", !unseenBlocked.error && unseenBlocked.text.includes("You are offline"), unseenBlocked.error || "");
    await blocked.close();
  } catch (error) {
    check("offline navigation test ran to the end", false, error.message.split("\n")[0]);
  } finally {
    await browser.close();
    // Kill the whole process tree first: once the shell wrapper is gone, the app server it started would be orphaned
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already stopped
    }
    server.kill();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
})();

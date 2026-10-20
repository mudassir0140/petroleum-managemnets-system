// Realistic offline use of the production build. The pump owner signs in through the real form, moves between pages with
// the sidebar links (in-app navigation), then the network is turned off. Pages visited online must open offline, both
// by reload and by a sidebar link, and a supported change made offline must be sent when the network returns.
// Run: node real-nav-test.cjs   (needs a built app, Microsoft Edge, and MongoDB on MONGO_URI)
const path = require("path");
const crypto = require("crypto");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));

const APP_DIR = process.env.APP_DIR || path.resolve(__dirname, "../..");
const { MongoClient, ObjectId } = require(path.join(APP_DIR, "node_modules/mongodb"));
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const DB_NAME = "pms_realnav";
const PORT = Number(process.env.REAL_PORT) || 3380;
const BASE = `http://localhost:${PORT}`;

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const hash = (pw) => {
  const salt = crypto.randomBytes(32).toString("hex");
  return `${salt}:${crypto.createHmac("sha256", salt).update(pw).digest("hex")}`;
};

async function startServer() {
  try {
    if ((await fetch(`${BASE}/auth/login`)).ok) throw new Error(`port ${PORT} is already in use: stop the old server first`);
  } catch (error) {
    if (String(error.message).startsWith("port ")) throw error;
  }
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: APP_DIR,
    env: { ...process.env, MONGODB_URI: MONGO_URI, MONGODB_DB: DB_NAME },
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

// Page text after a navigation with the network off, or the browser error when there is none
async function textOf(page) {
  await page.waitForTimeout(1200);
  return (await page.locator("body").innerText()).trim();
}

(async () => {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  await db.dropDatabase();
  const pumpId = new ObjectId();
  const now = new Date();
  await db.collection("pumps").insertOne({ _id: pumpId, name: "Real PSO", ownerName: "Ali", ownerEmail: "ali@real", ownerPasswordHash: hash("OwnerPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: now });
  await db.collection("fuel_rates").insertOne({ pumpId, petrolRate: 300, dieselRate: 310, date: now, createdAt: now });

  const server = await startServer();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign in through the real form
    await page.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.locator("input[type=email]").fill("ali@real");
    await page.locator("input[type=password]").fill("OwnerPass123");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/pumpadmin/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    check("online: signs in and lands on the overview", /\/pumpadmin$/.test(new URL(page.url()).pathname), page.url());

    // Diagnostics: the links on the page and what the worker has stored
    const diag = await page.evaluate(async () => {
      const links = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("/pumpadmin"));
      const keys = {};
      for (const name of await caches.keys()) keys[name] = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search).slice(0, 30);
      return { links: [...new Set(links)], controller: Boolean(navigator.serviceWorker.controller), keys };
    });
    console.log("diagnostics:", JSON.stringify(diag));

    // Move between pages with the sidebar, as a person does
    const visitedByLink = [];
    for (const href of ["/pumpadmin/sales", "/pumpadmin/fuel-stock", "/pumpadmin/employees", "/pumpadmin/khata"]) {
      // The owner navigation is on the overview: go back there, then follow the link, as a person does
      await page.goto(`${BASE}/pumpadmin`, { waitUntil: "networkidle" });
      const link = page.locator(`a[href="${href}"]`).first();
      await link.waitFor({ state: "attached", timeout: 20000 }).catch(() => undefined);
      if ((await link.count()) === 0) {
        check(`online: sidebar link to ${href} exists`, false);
        continue;
      }
      await link.click();
      await page.waitForURL((u) => u.pathname === href, { timeout: 30000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(1500);
      visitedByLink.push(href);
    }
    check("online: visited four pages through the sidebar", visitedByLink.length === 4, visitedByLink.join(" "));

    // Network off. Reload the page the person is on.
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" }).catch((e) => console.log("reload error:", e.message.split("\n")[0]));
    const reloaded = await textOf(page);
    check("offline: reloading the current page shows the page", reloaded.length > 80 && !reloaded.includes("You are offline"), `${reloaded.length} characters`);

    // Sidebar links offline
    for (const href of ["/pumpadmin/sales", "/pumpadmin/employees"]) {
      await page.goto(`${BASE}/pumpadmin`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
      await textOf(page);
      const link = page.locator(`a[href="${href}"]`).first();
      await link.waitFor({ state: "attached", timeout: 20000 }).catch(() => undefined);
      if ((await link.count()) === 0) {
        check(`offline: sidebar link to ${href} is still there`, false);
        continue;
      }
      await link.click({ timeout: 10000 }).catch((e) => console.log("click error:", e.message.split("\n")[0]));
      await page.waitForTimeout(3000);
      const text = await textOf(page);
      check(`offline: sidebar link to ${href} opens the page`, page.url().endsWith(href) && text.length > 80 && !text.includes("You are offline"), `${page.url()} ${text.length} characters`);
    }

    // Full loads offline of pages visited online
    for (const href of ["/pumpadmin/fuel-stock", "/pumpadmin/employees"]) {
      await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" }).catch((e) => console.log("goto error:", e.message.split("\n")[0]));
      const text = await textOf(page);
      check(`offline: full load of ${href} shows the page`, text.length > 80 && !text.includes("You are offline"), `${text.length} characters`);
    }

    // A supported change made offline: a sale on the sales page, queued on this device
    await page.goto(`${BASE}/pumpadmin`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await textOf(page);
    await page.locator('a[href="/pumpadmin/sales"]').first().click().catch(() => undefined);
    await page.waitForURL((u) => u.pathname === "/pumpadmin/sales", { timeout: 20000 }).catch(() => undefined);
    const salesForm = page.locator("form").filter({ hasText: "Save shift sales" });
    await salesForm.waitFor({ timeout: 20000 }).catch(() => undefined);
    const numbers = salesForm.locator('input[type="number"]');
    await numbers.nth(0).fill("120");
    await numbers.nth(1).fill("60");
    await numbers.nth(2).fill("40000");
    await numbers.nth(3).fill("5000");
    await salesForm.locator('button[type="submit"]').click();
    await page.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 }).catch(() => undefined);
    const queued = await page.evaluate(async () => {
      const open = indexedDB.open("pms-offline");
      return new Promise((resolve) => {
        open.onsuccess = () => {
          const req = open.result.transaction("outbox", "readonly").objectStore("outbox").count();
          req.onsuccess = () => resolve(req.result);
        };
        open.onerror = () => resolve(-1);
      });
    });
    const salesBefore = await db.collection("sales").countDocuments({ pumpId });
    check("offline: the sale is queued on the device, not in the database yet", queued === 1 && salesBefore === 0, `queued ${queued}, rows ${salesBefore}`);

    // The network returns: the queue is sent by itself, once
    await context.setOffline(false);
    let salesAfter = 0;
    for (let i = 0; i < 60 && salesAfter === 0; i++) {
      await page.waitForTimeout(1000);
      salesAfter = await db.collection("sales").countDocuments({ pumpId });
    }
    check("online again: the queued sale is stored once", salesAfter === 1, `rows ${salesAfter}`);
  } catch (error) {
    check("real navigation test ran to the end", false, error.message.split("\n")[0]);
  } finally {
    await browser.close();
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already stopped
    }
    server.kill();
    await db.dropDatabase();
    await mongo.close();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
})();

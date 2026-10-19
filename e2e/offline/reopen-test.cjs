// Reopen test: a sale is queued offline, the browser is closed, and the browser is reopened online. The queued sale must
// reach MongoDB without the app being opened (the offline page asks the service worker to send it), and must be stored
// once even when the app is opened afterwards. Uses a persistent profile, so the browser really restarts.
// Run: node reopen-test.cjs   (needs a built app, MongoDB on MONGO_URI, and Microsoft Edge)
const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));
const crypto = require("crypto");

const APP_DIR = process.env.APP_DIR || path.resolve(__dirname, "../..");
const { MongoClient, ObjectId } = require(path.join(APP_DIR, "node_modules/mongodb"));
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const PORT = 3150;
const BASE = `http://localhost:${PORT}`;
const DB_NAME = "pms_reopen";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const hash = (pw) => {
  const salt = crypto.randomBytes(32).toString("hex");
  return `${salt}:${crypto.createHmac("sha256", salt).update(pw).digest("hex")}`;
};

async function queued(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("pms-offline");
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("outbox")) return db.close(), resolve(0);
          const req = db.transaction("outbox", "readonly").objectStore("outbox").count();
          req.onsuccess = () => (db.close(), resolve(req.result));
        };
        open.onerror = () => resolve(-1);
      })
  );
}

async function startServer() {
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

(async () => {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  await db.dropDatabase();
  const pumpId = new ObjectId();
  await db.collection("pumps").insertOne({ _id: pumpId, name: "Reopen PSO", ownerName: "Ali", ownerEmail: "ali@reopen", ownerPasswordHash: hash("OwnerPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: new Date() });
  await db.collection("fuel_rates").insertOne({ pumpId, petrolRate: 300, dieselRate: 310, date: new Date(), createdAt: new Date() });

  const server = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pms-reopen-"));
  const launch = () => chromium.launchPersistentContext(profile, { executablePath: EDGE, headless: true });
  try {
    // 1. Sign in, go offline, log a sale: it waits on the device. Then the browser is closed.
    let context = await launch();
    let page = await context.newPage();
    await page.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
    await page.locator("input[type=email]").fill("ali@reopen");
    await page.locator("input[type=password]").fill("OwnerPass123");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/pumpadmin/, { timeout: 30000 });
    await page.goto(`${BASE}/pumpadmin/sales`, { waitUntil: "networkidle" });
    await page.evaluate(() => navigator.serviceWorker.ready);
    const form = page.locator("form").filter({ hasText: "Save shift sales" });
    await form.waitFor();
    const numbers = form.locator('input[type="number"]');
    await numbers.nth(0).fill("80");
    await numbers.nth(1).fill("20");
    await numbers.nth(2).fill("9000");
    await numbers.nth(3).fill("1000");
    await context.setOffline(true);
    await form.locator('button[type="submit"]').click();
    await page.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(500);
    check("before the reopen: the sale waits on the device", (await queued(page)) === 1, `queued ${await queued(page)}`);
    check("before the reopen: MongoDB has no sale yet", (await db.collection("sales").countDocuments({ pumpId })) === 0);
    await context.close();

    // 2. Reopen the browser, online, signed out (the sign-in cookie is a browser-session cookie, so it is gone).
    //    The queued sale must be kept and marked for sign-in, and nothing may be sent.
    context = await launch();
    await context.route((url) => new URL(url).pathname === "/", (route) => route.abort());
    page = await context.newPage();
    await page.goto(`${BASE}/offline.html`, { waitUntil: "load" });
    await page.waitForTimeout(1200); // read the queue before the page hands over to the app
    const afterReopen = await page.evaluate(() =>
      new Promise((resolve) => {
        const open = indexedDB.open("pms-offline");
        open.onsuccess = () => {
          const req = open.result.transaction("outbox", "readonly").objectStore("outbox").getAll();
          req.onsuccess = () => (open.result.close(), resolve(req.result.map((i) => i.status)));
        };
        open.onerror = () => resolve([]);
      })
    );
    check("reopened signed out: the sale is kept on the device and marked for sign-in", afterReopen.length === 1 && afterReopen[0] === "sign-in", afterReopen.join(","));
    check("reopened signed out: nothing is sent", (await db.collection("sales").countDocuments({ pumpId })) === 0);
    await context.close();

    // 3. Sign in again with the same account, online. The app sends the kept sale once, and the offline page is not needed.
    context = await launch();
    page = await context.newPage();
    await page.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
    await page.locator("input[type=email]").fill("ali@reopen");
    await page.locator("input[type=password]").fill("OwnerPass123");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/pumpadmin/, { timeout: 30000 });
    let synced = false;
    for (let i = 0; i < 200 && !synced; i++) {
      synced = (await db.collection("sales").countDocuments({ pumpId })) === 1;
      if (!synced) await new Promise((r) => setTimeout(r, 500));
    }
    check("signed in again: the kept sale is sent", synced, `sales ${await db.collection("sales").countDocuments({ pumpId })}`);
    await page.waitForTimeout(3000);
    check("signed in again: the sale is stored exactly once", (await db.collection("sales").countDocuments({ pumpId })) === 1);
    const row = await db.collection("sales").findOne({ pumpId });
    check("the stored sale has the entered litres (80 petrol, 20 diesel)", row && row.petrolLitres === 80 && row.dieselLitres === 20);
    await context.close();

    // 4. Reopen again and open the app: nothing is sent a second time
    context = await launch();
    page = await context.newPage();
    await page.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
    await page.locator("input[type=email]").fill("ali@reopen");
    await page.locator("input[type=password]").fill("OwnerPass123");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/pumpadmin/, { timeout: 30000 });
    await page.waitForTimeout(4000);
    check("reopened again: still one sale", (await db.collection("sales").countDocuments({ pumpId })) === 1);
    await context.close();
  } catch (error) {
    check("reopen flow ran to the end", false, error.message);
  } finally {
    server.kill();
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already stopped
    }
    await db.dropDatabase();
    await mongo.close();
    fs.rmSync(profile, { recursive: true, force: true });
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
})();

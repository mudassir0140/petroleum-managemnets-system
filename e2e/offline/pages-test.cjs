// Offline pages test: every essential page is visited online once, then loaded offline. A page passes when it renders
// its own content from the device, not the offline page. Covers the pump owner, the attendant and the khata client.
// Run: node pages-test.cjs   (needs a built app, MongoDB on MONGO_URI, and Microsoft Edge)
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));
const crypto = require("crypto");

const APP_DIR = process.env.APP_DIR || path.resolve(__dirname, "../..");
const { MongoClient, ObjectId } = require(path.join(APP_DIR, "node_modules/mongodb"));
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const PORT = Number(process.env.PAGES_PORT) || 3160;
const BASE = `http://localhost:${PORT}`;
const DB_NAME = "pms_pages";

const OWNER_PAGES = [
  "/pumpadmin",
  "/pumpadmin/sales",
  "/pumpadmin/khata",
  "/pumpadmin/khata/accounts",
  "/pumpadmin/bank",
  "/pumpadmin/wallet",
  "/pumpadmin/employees",
  "/pumpadmin/staff",
  "/pumpadmin/tankers",
  "/pumpadmin/connect",
  "/pumpadmin/fuel-orders",
  "/pumpadmin/fuel-stock",
  "/pumpadmin/fuel-price",
  "/pumpadmin/payments",
  "/pumpadmin/reports",
];
const ATTENDANT_PAGES = ["/dashboard/attendant/attendance", "/dashboard/attendant/khata"];
const CLIENT_PAGES = ["/khata-client/dashboard"];

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
  // A server left running from an earlier run would answer instead of the build under test, so refuse to start.
  try {
    if ((await fetch(`http://localhost:${PORT}/auth/login`)).ok) throw new Error(`port ${PORT} is already in use: stop the old server first`);
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

// Visits each page online, then loads it offline, in one browser context
async function checkPages(browser, label, signIn, pages) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page);
  for (const pathname of pages) {
    await page.goto(`${BASE}${pathname}`, { waitUntil: "networkidle" }).catch(() => undefined);
  }
  await context.setOffline(true);
  for (const pathname of pages) {
    let ok = false;
    let detail = "";
    try {
      await page.goto(`${BASE}${pathname}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1500);
      const text = (await page.locator("body").innerText()).trim();
      const offlinePage = text.includes("You are offline");
      const errorScreen = /Application error|Something went wrong/i.test(text);
      ok = !offlinePage && !errorScreen && text.length > 80;
      detail = offlinePage ? "offline page shown" : `${text.length} characters of content`;
    } catch (error) {
      detail = error.message.split("\n")[0];
    }
    check(`${label} offline: ${pathname}`, ok, detail);
  }
  await context.setOffline(false);
  await context.close();
}

(async () => {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  await db.dropDatabase();
  const pumpId = new ObjectId();
  const now = new Date();
  await db.collection("pumps").insertOne({ _id: pumpId, name: "Pages PSO", ownerName: "Ali", ownerEmail: "ali@pages", ownerPasswordHash: hash("OwnerPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: now });
  await db.collection("pump_employees").insertOne({ pumpId, name: "Attendant One", username: "attendant1", passwordHash: hash("AttendantPass1"), role: "pump-attendant", shiftHours: 8, createdAt: now });
  await db.collection("fuel_rates").insertOne({ pumpId, petrolRate: 300, dieselRate: 310, date: now, createdAt: now });
  const clientId = new ObjectId();
  await db.collection("khataClients").insertOne({ _id: clientId, pumpId, clientName: "Client One", department: "Ops", phone: "0300", username: "client1", passwordHash: hash("ClientPass1"), totalFuelAmount: 0, remainingBalance: 0, petrolGivenRate: 280, dieselGivenRate: 290, createdAt: now });

  const server = await startServer();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    // A sign-in page visited online is available offline (it holds no personal data)
    const signInContext = await browser.newContext();
    const signInPage = await signInContext.newPage();
    await signInPage.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
    await signInPage.waitForTimeout(3000);
    await signInPage.waitForLoadState("networkidle");
    await signInContext.setOffline(true);
    await signInPage.goto(`${BASE}/pump-owner/login`, { waitUntil: "domcontentloaded" });
    await signInPage.waitForTimeout(1500);
    const signInText = await signInPage.locator("body").innerText();
    check("sign-in page offline: /pump-owner/login loads from the device", !signInText.includes("You are offline") && signInText.length > 80, signInText.slice(0, 120).replace(/s+/g, " "));
    await signInContext.close();

    await checkPages(
      browser,
      "owner",
      async (page) => {
        await page.goto(`${BASE}/pump-owner/login`, { waitUntil: "networkidle" });
        // The first visit in a new browser reloads once so its pages are kept; let that finish first
        await page.waitForTimeout(3000);
        await page.waitForLoadState("networkidle");
        await page.locator("input[type=email]").fill("ali@pages");
        await page.locator("input[type=password]").fill("OwnerPass123");
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL(/\/pumpadmin/, { timeout: 30000 });
      },
      [...OWNER_PAGES, `/pumpadmin/khata/${clientId}`]
    );
    await checkPages(
      browser,
      "attendant",
      async (page) => {
        await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
        await page.waitForTimeout(3000);
        await page.waitForLoadState("networkidle");
        await page.locator('input[type=text]').first().fill("attendant1");
        await page.locator("input[type=password]").fill("AttendantPass1");
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL(/\/dashboard\/attendant/, { timeout: 30000 });
      },
      ATTENDANT_PAGES
    );
    await checkPages(
      browser,
      "client",
      async (page) => {
        await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle" });
        await page.waitForTimeout(3000);
        await page.waitForLoadState("networkidle");
        await page.locator('input[type=text]').first().fill("client1");
        await page.locator("input[type=password]").fill("ClientPass1");
        await page.locator('button[type="submit"]').first().click();
        await page.waitForURL(/khata-client\/dashboard/, { timeout: 30000 });
      },
      CLIENT_PAGES
    );
  } catch (error) {
    check("pages test ran to the end", false, error.message);
  } finally {
    await browser.close();
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already stopped
    }
    server.kill();
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already stopped
    }
    await db.dropDatabase();
    await mongo.close();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
})();

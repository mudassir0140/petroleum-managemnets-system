// Logged-in browser tests of the offline flows: owner sales, chat messages and notification read marks, and the
// attendant's shift start and end with a photo. Each flow signs in through the real login page, goes offline,
// performs the action, checks what is queued, goes back online, and checks MongoDB. Runs against the production
// build with a local MongoDB (port 27018). Uses Microsoft Edge on this PC.
const path = require("path");
const fs = require("fs");
const { spawn, execFileSync } = require("child_process");
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));

const WT = (process.env.APP_DIR || require("path").resolve(__dirname, "../.."));
const MONGO_MODULE = path.join(WT, "node_modules/mongodb");
const { MongoClient, ObjectId } = require(MONGO_MODULE);
const crypto = require("crypto");
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = Number(process.env.BF_PORT) || 3140;
const BASE = `http://localhost:${PORT}`;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const DB_NAME = "pms_browser";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const hash = (pw) => {
  const salt = crypto.randomBytes(32).toString("hex");
  return `${salt}:${crypto.createHmac("sha256", salt).update(pw).digest("hex")}`;
};
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

// Number of queued changes in the page's IndexedDB outbox
const outboxCount = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("pms-offline");
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("outbox")) {
            db.close();
            return resolve(0);
          }
          const req = db.transaction("outbox", "readonly").objectStore("outbox").count();
          req.onsuccess = () => {
            db.close();
            resolve(req.result);
          };
        };
        open.onerror = () => resolve(-1);
      })
  );

// Waits until the queue holds the expected change, so a check does not read it before it is written
async function queuedCount(page, timeoutMs = 5000) {
  const started = Date.now();
  let n = await outboxCount(page);
  while (n !== 1 && Date.now() - started < timeoutMs) {
    await page.waitForTimeout(250);
    n = await outboxCount(page);
  }
  return n;
}

// Waits until the queue is empty (the sync sends it when the connection returns)
async function waitForSync(page, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if ((await outboxCount(page)) === 0) return true;
    await page.waitForTimeout(500);
  }
  // Show what is still queued, so a stuck change can be seen in the log
  const left = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("pms-offline");
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction("outbox", "readonly").objectStore("outbox").getAll();
          req.onsuccess = () => {
            db.close();
            resolve(req.result.map((i) => ({ url: i.url, status: i.status, attempts: i.attempts, lastError: i.lastError })));
          };
        };
        open.onerror = () => resolve([]);
      })
  );
  console.log("  still queued:", JSON.stringify(left));
  return false;
}

async function seed(db) {
  await db.dropDatabase();
  const pumpId = new ObjectId();
  const otherId = new ObjectId();
  const now = new Date();
  await db.collection("pumps").insertMany([
    { _id: pumpId, name: "Browser PSO", ownerName: "Ali", ownerEmail: "ali@browserpso", ownerPasswordHash: hash("OwnerPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: now },
    { _id: otherId, name: "Other Pump", ownerName: "Sara", ownerEmail: "sara@other", ownerPasswordHash: hash("OtherPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: now },
  ]);
  await db.collection("pump_employees").insertOne({ pumpId, name: "Attendant One", username: "attendant1", passwordHash: hash("AttendantPass1"), role: "pump-attendant", shiftHours: 8, createdAt: now });
  await db.collection("fuel_rates").insertOne({ pumpId, petrolRate: 300, dieselRate: 310, date: now, createdAt: now });
  await db.collection("pump_friend_requests").insertOne({ senderId: pumpId, receiverId: otherId, senderName: "Browser PSO", receiverName: "Other Pump", status: "accepted", createdAt: now });
  const notificationId = new ObjectId();
  await db.collection("notifications").insertOne({ _id: notificationId, recipientType: "pump-owner", recipientId: pumpId, type: "khata-review", title: "Khata needs review", message: "A khata entry needs your review.", href: "/pumpadmin/connect", read: false, createdAt: now });
  await db.collection("khataClients").insertOne({ pumpId, clientName: "Client One", department: "Ops", phone: "0300", username: "client1", passwordHash: hash("ClientPass1"), totalFuelAmount: 0, remainingBalance: 0, petrolGivenRate: 280, dieselGivenRate: 290, createdAt: now });
  const kc = await db.collection("khataClients").findOne({ username: "client1" });
  const todayStr = new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
  const ownerPayId = new ObjectId();
  const clientPayId = new ObjectId();
  await db.collection("khataPayments").insertMany([
    { _id: ownerPayId, pumpId, khataClientId: kc._id, txnId: "KTX-SEED-OWNER", method: "cash", status: "confirmed", source: "owner", amountReceived: 500, advancePaid: 0, date: todayStr, note: "owner seed", allocations: [], unallocated: 0, recordedBy: "Ali", createdAt: now, updatedAt: now, statusHistory: [] },
    { _id: clientPayId, pumpId, khataClientId: kc._id, txnId: "KTX-SEED-CLIENT", method: "bank-transfer", status: "pending", source: "client", amountReceived: 700, advancePaid: 0, date: todayStr, note: "client seed", bankAccount: "HBL-123", transactionId: "TX-SEED-1", allocations: null, unallocated: null, createdAt: now, updatedAt: now, statusHistory: [] },
  ]);
  const clientId = kc._id;
  return { pumpId, otherId, notificationId, clientId, ownerPayId, clientPayId };
}

async function startServer() {
  // A server left running from an earlier run would answer instead of the build under test, so refuse to start.
  try {
    if ((await fetch(`http://localhost:${PORT}/auth/login`)).ok) throw new Error(`port ${PORT} is already in use: stop the old server first`);
  } catch (error) {
    if (String(error.message).startsWith("port ")) throw error;
  }
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: WT,
    env: { ...process.env, MONGODB_URI: MONGO_URI, MONGODB_DB: DB_NAME },
    shell: true,
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/auth/login`);
      if (r.ok) return child;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server did not start");
}

async function login(context, url, fields) {
  const page = await context.newPage();
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  for (const [selector, value] of fields.inputs) await page.locator(selector).fill(value);
  await page.locator('button[type="submit"]').first().click();
  return page;
}

(async () => {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  const ids = await seed(db);
  const server = await startServer();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    // ---------- Owner: sales, chat and notification read marks
    const ownerCtx = await browser.newContext();
    const owner = await login(ownerCtx, "/pump-owner/login", { inputs: [["input[type=email]", "ali@browserpso"], ['input[type=password]', "OwnerPass123"]] });
    await owner.waitForURL(/\/pumpadmin/, { timeout: 30000 });
    check("owner: signs in through the login page and lands on the pump dashboard", owner.url().includes("/pumpadmin"), owner.url());

    // 1. Sales log offline
    await owner.goto(`${BASE}/pumpadmin/sales`, { waitUntil: "networkidle" });
    const salesForm = owner.locator("form").filter({ hasText: "Save shift sales" });
    await salesForm.waitFor();
    const salesNumbers = salesForm.locator('input[type="number"]');
    await salesNumbers.nth(0).fill("120");
    await salesNumbers.nth(1).fill("60");
    await salesNumbers.nth(2).fill("40000");
    await salesNumbers.nth(3).fill("5000");
    await ownerCtx.setOffline(true);
    await salesForm.locator('button[type="submit"]').click();
    await owner.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
    check("sales offline: the form says the sale is saved on this device", true);
    check("sales offline: one change waits in the device queue", (await queuedCount(owner)) === 1, `queued ${await queuedCount(owner)}`);
    const salesBefore = await db.collection("sales").countDocuments({ pumpId: ids.pumpId });
    check("sales offline: MongoDB has no row yet", salesBefore === 0, `rows ${salesBefore}`);
    await ownerCtx.setOffline(false);
    const salesSynced = await waitForSync(owner);
    check("sales online: the queue empties by itself", salesSynced);
    const salesRows = await db.collection("sales").find({ pumpId: ids.pumpId }).toArray();
    check("sales online: MongoDB stores the sale once, with the entered litres", salesRows.length === 1 && salesRows[0].petrolLitres === 120 && salesRows[0].dieselLitres === 60, `rows ${salesRows.length}`);
    await owner.reload({ waitUntil: "networkidle" });
    const salesAfterReload = await db.collection("sales").countDocuments({ pumpId: ids.pumpId });
    check("sales after reload: still one row (no duplicate)", salesAfterReload === 1, `rows ${salesAfterReload}`);

    // 2. Chat message offline
    await owner.goto(`${BASE}/pumpadmin/connect`, { waitUntil: "networkidle" });
    await owner.locator("li", { hasText: "Other Pump" }).getByRole("button", { name: "Chat" }).first().click();
    const chatBox = owner.locator('textarea[placeholder="Write a message / پیغام لکھیں"]');
    await chatBox.waitFor();
    await ownerCtx.setOffline(true);
    await chatBox.fill("Hello while offline");
    await owner.getByRole("button", { name: "Send" }).click();
    await owner.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
    check("chat offline: the message is saved on this device, not shown as sent", true);
    check("chat offline: one change waits in the device queue", (await queuedCount(owner)) === 1, `queued ${await queuedCount(owner)}`);
    check("chat offline: MongoDB has no copy yet", (await db.collection("connect_messages").countDocuments({ body: "Hello while offline" })) === 0);
    await ownerCtx.setOffline(false);
    const chatSynced = await waitForSync(owner);
    check("chat online: the queue empties by itself", chatSynced);
    await owner.reload({ waitUntil: "networkidle" });
    await owner.locator("li", { hasText: "Other Pump" }).getByRole("button", { name: "Chat" }).first().click();
    await owner.getByText("Hello while offline", { exact: true }).first().waitFor({ timeout: 20000 });
    check("chat online: the message appears in the chat after reload", true);
    const chatCount = await db.collection("connect_messages").countDocuments({ body: "Hello while offline" });
    check("chat online: MongoDB holds exactly one copy", chatCount === 1, `copies ${chatCount}`);

    // 3. Notification read mark offline
    await owner.goto(`${BASE}/pumpadmin/connect`, { waitUntil: "networkidle" });
    await owner.locator('button[aria-label="Notifications"]').click();
    const notificationItem = owner.getByRole("button", { name: /Khata needs review/ }).first();
    await notificationItem.waitFor({ timeout: 20000 });
    const unreadBefore = await db.collection("notifications").countDocuments({ _id: ids.notificationId, read: false });
    check("read mark: the notification is unread in MongoDB before the test", unreadBefore === 1);
    await ownerCtx.setOffline(true);
    await notificationItem.click();
    await page_wait(1500);
    check("read mark offline: one change waits in the device queue", (await queuedCount(owner)) === 1, `queued ${await queuedCount(owner)}`);
    check("read mark offline: MongoDB still shows it unread", (await db.collection("notifications").countDocuments({ _id: ids.notificationId, read: false })) === 1);
    await ownerCtx.setOffline(false);
    const readSynced = await waitForSync(owner);
    check("read mark online: the queue empties by itself", readSynced);
    const readNow = await db.collection("notifications").findOne({ _id: ids.notificationId });
    check("read mark online: MongoDB marks the notification read", readNow && readNow.read === true);
    // (owner checks below)
  // ---------- Owner: a payment proof image added offline, sent on reconnect, stored once
  await owner.goto(`${BASE}/pumpadmin/khata/${ids.clientId}`, { waitUntil: "networkidle" });
  const ownerAddImage = owner.locator("label", { hasText: "Add image" }).first();
  await ownerAddImage.waitFor({ timeout: 30000 });
  await ownerCtx.setOffline(true);
  await ownerAddImage.locator('input[type="file"]').setInputFiles({ name: "receipt.png", mimeType: "image/png", buffer: PNG });
  await owner.waitForTimeout(1500);
  check("owner proof offline: one change waits in the device queue", (await queuedCount(owner)) === 1, `queued ${await queuedCount(owner)}`);
  check("owner proof offline: MongoDB has no image yet", (await db.collection("khataAttachments").countDocuments({ paymentId: ids.ownerPayId })) === 0);
  await ownerCtx.setOffline(false);
  check("owner proof reconnect: the queue empties by itself", await waitForSync(owner));
  // A second "back online" signal must not send the image again
  await owner.evaluate(() => window.dispatchEvent(new Event("online")));
  await owner.waitForTimeout(2000);
  const ownerImages = await db.collection("khataAttachments").countDocuments({ paymentId: ids.ownerPayId });
  check("owner proof reconnect: MongoDB stores the image once, even after repeated reconnect signals", ownerImages === 1, `images ${ownerImages}`);
  const ownerPayNow = await db.collection("khataPayments").findOne({ _id: ids.ownerPayId });
  check("owner proof reconnect: the payment is linked to the image", ownerPayNow && ownerPayNow.attachmentId != null);
  await owner.reload({ waitUntil: "networkidle" });
  const viewLinks = await owner.getByText("View image", { exact: false }).count();
  check("owner proof after reload: the payment shows a View image link", viewLinks >= 1, `links ${viewLinks}`);

  // ---------- Owner: the employee list is read from the device cache when offline
  await owner.goto(`${BASE}/pumpadmin/employees`, { waitUntil: "networkidle" });
  await owner.getByText("Attendant One", { exact: false }).first().waitFor({ timeout: 20000 });
  await ownerCtx.setOffline(true);
  await owner.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
  const listedOffline = await owner.getByText("Attendant One", { exact: false }).first().waitFor({ timeout: 20000 }).then(() => true, () => false);
  check("employees offline: the page and its list load from the device after a reload", listedOffline);
  await ownerCtx.setOffline(false);

  // ---------- Khata client: a payment submitted offline from the client dashboard
  const clientCtx = await browser.newContext();
  const client = await login(clientCtx, "/auth/login", { inputs: [['input[type=text]', "client1"], ['input[type=password]', "ClientPass1"]] });
  await client.waitForURL(/khata-client\/dashboard/, { timeout: 30000 });
  check("client: signs in through the login page and lands on the client dashboard", client.url().includes("/khata-client/dashboard"), client.url());
  await client.waitForLoadState("networkidle");
  const paySection = client.locator("form").filter({ hasText: "Submit payment" }).first();
  await paySection.waitFor({ timeout: 20000 });
  await paySection.locator('input[type="number"]').first().fill("500");
  await paySection.locator('input[type="text"]').first().fill("client offline");
  await clientCtx.setOffline(true);
  await paySection.locator('button[type="submit"]').click();
  await client.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
  check("client offline: the payment is saved on this device", true);
  check("client offline: one change waits in the device queue", (await queuedCount(client)) === 1, `queued ${await queuedCount(client)}`);
  check("client offline: MongoDB has no copy yet", (await db.collection("khataPayments").countDocuments({ note: "client offline" })) === 0);
  await clientCtx.setOffline(false);
  check("client online: the queue empties by itself", await waitForSync(client));
  const clientPays = await db.collection("khataPayments").countDocuments({ note: "client offline" });
  check("client online: MongoDB stores the submission exactly once", clientPays === 1, `copies ${clientPays}`);
  // ---------- Khata client: a proof image added offline to an earlier payment, sent on reconnect, stored once
  const clientAddImage = client.locator("label", { hasText: "Add image" }).first();
  await clientAddImage.waitFor({ timeout: 30000 });
  await clientCtx.setOffline(true);
  await clientAddImage.locator('input[type="file"]').setInputFiles({ name: "transfer.png", mimeType: "image/png", buffer: PNG });
  await client.waitForTimeout(1500);
  check("client proof offline: one change waits in the device queue", (await queuedCount(client)) === 1, `queued ${await queuedCount(client)}`);
  check("client proof offline: MongoDB has no image yet", (await db.collection("khataAttachments").countDocuments({ paymentId: ids.clientPayId })) === 0);
  await clientCtx.setOffline(false);
  check("client proof reconnect: the queue empties by itself", await waitForSync(client));
  await client.evaluate(() => window.dispatchEvent(new Event("online")));
  await client.waitForTimeout(2000);
  const clientImages = await db.collection("khataAttachments").countDocuments({ paymentId: ids.clientPayId });
  check("client proof reconnect: MongoDB stores the image once, even after repeated reconnect signals", clientImages === 1, `images ${clientImages}`);
  await client.reload({ waitUntil: "networkidle" });
  check("client proof after reload: the payment shows a View image link", (await client.getByText("View image", { exact: false }).count()) >= 1);

  await clientCtx.close();

    await ownerCtx.close();

    // ---------- Attendant: shift start and end with a photo, offline
    const attCtx = await browser.newContext();
    const att = await login(attCtx, "/auth/login", { inputs: [['input[type=text]', "attendant1"], ['input[type=password]', "AttendantPass1"]] });
    await att.waitForURL(/attendance/, { timeout: 30000 });
    check("attendant: signs in through the login page and lands on attendance", att.url().includes("/dashboard/attendant/attendance"), att.url());
    await att.goto(`${BASE}/dashboard/attendant/attendance`, { waitUntil: "networkidle" });
    await att.locator("button", { hasText: "Start Shift" }).first().click();
    const startForm = att.locator("form").filter({ hasText: "Start Shift" }).first();
    await startForm.locator('input[type="number"]').first().fill("1200");
    await startForm.locator('input[type="file"]').setInputFiles({ name: "meter.png", mimeType: "image/png", buffer: PNG });
    await attCtx.setOffline(true);
    await startForm.locator('button[type="submit"]').click();
    await att.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
    check("shift start offline: saved on this device with the photo", true);
    check("shift start offline: one change waits in the queue", (await queuedCount(att)) === 1, `queued ${await queuedCount(att)}`);
    const shiftsBefore = await db.collection("shifts").countDocuments({ startReading: 1200 });
    check("shift start offline: MongoDB has no shift yet", shiftsBefore === 0);
    await attCtx.setOffline(false);
    check("shift start online: the queue empties by itself", await waitForSync(att));
    let shifts = await db.collection("shifts").find({ startReading: 1200 }).toArray();
    check("shift start online: exactly one shift is stored", shifts.length === 1, `shifts ${shifts.length}`);

    // End of shift, offline, with a photo
    const endForm = att.locator("form").filter({ hasText: "End Shift" }).first();
    await endForm.locator('input[type="number"]').first().fill("1500");
    await endForm.locator('input[type="file"]').setInputFiles({ name: "meter-end.png", mimeType: "image/png", buffer: PNG });
    await attCtx.setOffline(true);
    await endForm.locator('button[type="submit"]').click();
    await att.getByText("Saved on this device", { exact: false }).first().waitFor({ timeout: 20000 });
    check("shift end offline: saved on this device with the photo", true);
    check("shift end offline: MongoDB still shows the shift open", (await db.collection("shifts").countDocuments({ startReading: 1200, endReading: null })) === 1);
    await attCtx.setOffline(false);
    check("shift end online: the queue empties by itself", await waitForSync(att));
    shifts = await db.collection("shifts").find({ startReading: 1200 }).toArray();
    check("shift end online: the shift is closed once, with the end reading", shifts.length === 1 && shifts[0].endReading === 1500, `shifts ${shifts.length}, end ${shifts[0] && shifts[0].endReading}`);
    check("shift end online: litres sold are calculated (300)", shifts[0] && shifts[0].litresSold === 300, `litres ${shifts[0] && shifts[0].litresSold}`);
    await attCtx.close();
  } catch (error) {
    check("browser flows ran to the end", false, error.message);
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
    console.log(`\n${results.length - failed} passed, ${failed} failed (database ${DB_NAME} dropped)`);
    process.exit(failed ? 1 : 0);
  }
})();

function page_wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

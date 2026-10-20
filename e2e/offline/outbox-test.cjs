// Browser test of the real offline outbox (src/lib/offline/outbox.ts), bundled for the browser, against a stub API that
// behaves like the server: it stores each Idempotency-Key once, and can save a change and then drop the response.
const http = require("http");
const path = require("path");
const fs = require("fs");
const esbuild = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "esbuild"));
const { chromium } = require(require("path").join(process.env.E2E_NODE_MODULES || __dirname, "playwright-core"));

const DIR = __dirname;
const REPO = (process.env.APP_DIR || require("path").resolve(__dirname, "../.."));
const EDGE = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 3120;

const state = { mode: "ok", saved: new Map(), received: [] };

const harness = `<!doctype html><html><body>
<script src="/outbox.bundle.js"></script>
<script>
  // Test helper: makes every queued item due now, so a sync sends it without waiting for the retry delay.
  window.makeDue = () => new Promise((resolve, reject) => {
    const open = indexedDB.open("pms-offline", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("outbox", { keyPath: "id" });
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("outbox", "readwrite");
      tx.objectStore("outbox").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { cursor.update({ ...cursor.value, nextAttemptAt: 0 }); cursor.continue(); }
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
  window.clearOutbox = () => new Promise((resolve, reject) => {
    const open = indexedDB.open("pms-offline", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("outbox", { keyPath: "id" });
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("outbox", "readwrite");
      tx.objectStore("outbox").clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  });
</script>
</body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/harness.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(harness);
  }
  if (req.url === "/outbox.bundle.js") {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    return res.end(fs.readFileSync(path.join(require("os").tmpdir(), "outbox.bundle.js")));
  }
  if (req.url === "/__state") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ saved: state.saved.size, received: state.received }));
  }
  if (req.url === "/__mode" && req.method === "POST") {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      state.mode = JSON.parse(data).mode;
      res.writeHead(200);
      res.end("ok");
    });
    return;
  }
  if (req.url === "/__reset" && req.method === "POST") {
    state.saved.clear();
    state.received.length = 0;
    res.writeHead(200);
    return res.end("ok");
  }
  if (req.url.startsWith("/api/") && state.mode === "down") {
    state.received.push({ key: req.headers["idempotency-key"], n: null, status: null });
    req.resume();
    req.on("end", () => req.socket.destroy());
    return;
  }
  if (req.url === "/api/khata/payments" && req.method === "POST") {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      const key = req.headers["idempotency-key"];
      const entry = { key, n: JSON.parse(data).n, status: null, clientTime: req.headers["x-client-time"] };
      state.received.push(entry);
      if (state.mode === "down") return req.socket.destroy(); // the connection fails before any answer
      const alreadySaved = state.saved.has(key);
      if (!alreadySaved && (state.mode === "ok" || state.mode === "saveThenDrop")) state.saved.set(key, entry.n);
      if (state.mode === "saveThenDrop" && !alreadySaved) return req.socket.destroy(); // saved, answer lost
      const status = { ok: 200, saveThenDrop: 200, "401": 401, "400": 400, "500": 500 }[state.mode];
      entry.status = status;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(status === 200 ? { success: true, duplicate: alreadySaved } : { error: `stub ${status}` }));
    });
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

async function setMode(mode) {
  await fetch(`http://localhost:${PORT}/__mode`, { method: "POST", body: JSON.stringify({ mode }) });
  state.mode = mode;
}

(async () => {
  await esbuild.build({
    entryPoints: [path.join(REPO, "src/lib/offline/outbox.ts")],
    bundle: true,
    format: "iife",
    globalName: "Outbox",
    outfile: path.join(require("os").tmpdir(), "outbox.bundle.js"),
    logLevel: "error",
  });

  server.listen(PORT);
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`http://localhost:${PORT}/harness.html`);
  await page.waitForFunction(() => typeof Outbox !== "undefined" && typeof window.makeDue === "function");
  await fetch(`http://localhost:${PORT}/__reset`, { method: "POST" });
  await page.evaluate(() => window.clearOutbox());

  const outbox = () => page.evaluate(() => Outbox.listOutbox());
  const sync = () => page.evaluate(() => Outbox.syncOutbox());
  const makeDue = () => page.evaluate(() => window.makeDue());
  const stub = async () => (await fetch(`http://localhost:${PORT}/__state`)).json();
  const send = (n) =>
    page.evaluate(
      (body) =>
        Outbox.offlineFetch("/api/khata/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body }).then(async (r) => ({ status: r.status, body: await r.text() })),
      JSON.stringify({ amount: n * 100, n })
    );

  // 1. Online: answered at once, nothing queued
  await setMode("ok");
  let r = await send(1);
  check("online: the server answers and nothing is queued", r.status === 200 && (await outbox()).length === 0, `status ${r.status}`);
  check("online: the server stores the change once", (await stub()).saved === 1);

  // 2. Server unreachable: queued, with the key the failed request carried
  await setMode("down");
  r = await send(2);
  let items = await outbox();
  const failedKey = (await stub()).received.at(-1).key;
  check("offline: the change is queued and the app gets a 202", r.status === 202 && items.length === 1, `status ${r.status}`);
  check("offline: the queued key is the one the failed request carried", items[0] && items[0].id === failedKey);
  check("offline: the queued item keeps its body", items[0] && JSON.parse(items[0].body).n === 2);

  // 3. Still unreachable: the sync keeps the item and schedules a retry; it is not dropped
  await sync();
  items = await outbox();
  check("still offline: the sync keeps the item and schedules a retry", items.length === 1 && items[0].attempts >= 1 && items[0].nextAttemptAt > Date.now());

  // 4. Reload: the queue survives (IndexedDB)
  await page.reload();
  await page.waitForFunction(() => typeof Outbox !== "undefined" && typeof window.makeDue === "function");
  check("reload: the queued change is still in IndexedDB", (await outbox()).length === 1);

  // 5. Connection back: sent once with the same key, and removed
  await setMode("ok");
  await makeDue();
  await sync();
  items = await outbox();
  let st = await stub();
  check("back online: the queued change is sent and removed", items.length === 0);
  check("back online: the server holds the change once, under the same key", st.saved === 2 && st.received.filter((x) => x.key === failedKey).length >= 1);

  // 6. Response lost after saving: the retry is recognised, no second record
  await setMode("saveThenDrop");
  await fetch(`http://localhost:${PORT}/__reset`, { method: "POST" });
  r = await send(3);
  // The browser may resend a dropped request on a new connection by itself. The server then answers it as a repeat.
  const requestsForKey = (await stub()).received.filter((x) => x.n === 3).length;
  check("response lost after saving: the change is answered as a repeat, not added twice", r.status === 202 || (r.status === 200 && requestsForKey >= 2), `status ${r.status}, requests ${requestsForKey}`);
  await setMode("ok");
  await makeDue();
  await sync();
  st = await stub();
  check("retry after a lost response: the server still holds one record", st.saved === 1, `saved ${st.saved}`);
  check("retry after a lost response: the queued copy is removed", (await outbox()).length === 0);

  // 7. Session ends before the sync: kept, marked for sign-in, sent after signing in again
  await setMode("down");
  await send(4);
  await setMode("401");
  await makeDue();
  await sync();
  items = await outbox();
  check("signed out before sync: kept and marked for sign-in", items.length === 1 && items[0].status === "sign-in", items[0] && items[0].status);
  await setMode("ok");
  await makeDue();
  await sync();
  check("signed in again: the change is sent and removed", (await outbox()).length === 0);

  // 8. Refused change (400): kept as failed for review, and the sync never sends it again
  await setMode("down");
  await send(5);
  await setMode("400");
  await makeDue();
  await sync();
  const sentBefore = (await stub()).received.length;
  await makeDue();
  await sync();
  items = await outbox();
  const sentAfter = (await stub()).received.length;
  check("refused (400): kept with status failed", items.length === 1 && items[0].status === "failed", items[0] && items[0].lastError);
  check("refused (400): not sent again by later syncs", sentAfter === sentBefore, `requests ${sentBefore} -> ${sentAfter}`);
  await page.evaluate(() => window.clearOutbox());

  // 9. Server error (500): the first change is retried later, the second waits behind it, order is kept
  await setMode("down");
  await send(6);
  await send(7);
  await setMode("500");
  await makeDue();
  const before = (await stub()).received.length;
  await sync();
  items = await outbox();
  const sentNow = (await stub()).received.length - before;
  check("server error: one request is sent, and the first change is retried later", sentNow === 1 && items.length === 2 && items[0].status === "pending" && items[0].attempts >= 1, `requests ${sentNow}`);
  check("server error: the changes keep their order", JSON.parse(items[0].body).n === 6 && JSON.parse(items[1].body).n === 7);
  await page.evaluate(() => window.clearOutbox());

  // 10. A month close is not queued: while offline the error reaches the caller
  await setMode("down");
  const outcome = await page.evaluate(() =>
    Outbox.offlineFetch("/api/khata/months/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(() => "answered", (e) => "rejected " + e.name)
  );
  check("offline: a month close is not queued, and the error reaches the caller", outcome.startsWith("rejected") && (await outbox()).length === 0, outcome);

  // 11. Two pages send the queue at the same moment: each queued change is sent once, and keeps its original time
  await setMode("down");
  await page.evaluate(() => window.clearOutbox());
  await send(8);
  await send(9);
  await send(10);
  const queued = await outbox();
  await setMode("ok");
  await fetch(`http://localhost:${PORT}/__reset`, { method: "POST" });
  const page2 = await page.context().newPage();
  await page2.goto(`http://localhost:${PORT}/harness.html`);
  await page2.waitForFunction(() => typeof Outbox !== "undefined" && typeof window.makeDue === "function");
  await makeDue();
  await Promise.all([sync(), page2.evaluate(() => Outbox.syncOutbox())]);
  const st2 = await stub();
  const sentOnce = [8, 9, 10].every((n) => st2.received.filter((x) => x.n === n).length === 1);
  check("two pages sync at once: each queued change is sent once", sentOnce, `requests ${st2.received.map((x) => x.n).join(",")}`);
  check("two pages sync at once: the queue is empty afterwards", (await outbox()).length === 0);
  const timesKept = queued.every((item) => st2.received.some((x) => x.n === JSON.parse(item.body).n && x.clientTime === item.clientTime));
  check("queued changes are sent with the time they were made", timesKept && queued.every((i) => i.clientTime));
  await page2.close();

  await browser.close();
  server.close();
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error("TEST CRASHED:", error);
  process.exit(2);
});

// Server side of the offline queue: a change sent again with the same Idempotency-Key is saved once.
// Run with: node --test scripts/offline-idempotency.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { idempotent, STALE_CLAIM_MS } from "../src/lib/offline/idempotency.ts";

// An in-memory answer store with the same rules as the MongoDB store.
function memoryStore() {
  const rows = new Map();
  return {
    rows,
    async claim(id, now) {
      const row = rows.get(id);
      if (!row) {
        rows.set(id, { state: "running", at: now });
        return { state: "claimed" };
      }
      if (row.state === "done") return { state: "done", answer: row.answer };
      if (now - row.at > STALE_CLAIM_MS) {
        rows.set(id, { state: "running", at: now });
        return { state: "claimed" };
      }
      return { state: "running" };
    },
    async complete(id, answer) {
      rows.set(id, { state: "done", answer });
    },
    async release(id) {
      rows.delete(id);
    },
  };
}

const KEY = "0123456789abcdef0123456789abcdef";
const url = "http://localhost/api/khata/payments";

function post(key, target = url) {
  const headers = { "Content-Type": "application/json" };
  if (key) headers["Idempotency-Key"] = key;
  return new Request(target, { method: "POST", headers, body: JSON.stringify({ amount: 5 }) });
}

test("without a key the route runs every time, as before", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({ paymentId: `p${runs}` }, { status: 201 });
  });
  await route(post(null));
  const second = await route(post(null));
  assert.equal(runs, 2);
  assert.equal((await second.json()).paymentId, "p2");
  assert.equal(store.rows.size, 0, "nothing is kept without a key");
});

test("a repeat with the same key gets the first answer and does not run the route again", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({ paymentId: "p1", success: true }, { status: 201 });
  });
  const first = await route(post(KEY));
  const again = await route(post(KEY));
  assert.equal(runs, 1);
  assert.equal(first.status, 201);
  assert.equal(again.status, 201);
  assert.deepEqual(await again.json(), { paymentId: "p1", success: true });
  assert.equal(again.headers.get("Idempotent-Replayed"), "true");
});

test("a client-error answer is kept too, so a retry gets the same refusal without a second run", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({ error: "Month is closed" }, { status: 400 });
  });
  await route(post(KEY));
  const again = await route(post(KEY));
  assert.equal(runs, 1);
  assert.equal(again.status, 400);
  assert.equal((await again.json()).error, "Month is closed");
});

test("a request that is still running answers 503 so the device retries later", async () => {
  const store = memoryStore();
  store.rows.set(`${new URL(url).pathname}|${KEY}`, { state: "running", at: Date.now() });
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({}, { status: 201 });
  });
  const response = await route(post(KEY));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Retry-After"), "5");
  assert.equal(runs, 0);
});

test("a claim left running for too long is taken over", async () => {
  const store = memoryStore();
  store.rows.set(`${new URL(url).pathname}|${KEY}`, { state: "running", at: Date.now() - STALE_CLAIM_MS - 1 });
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({ ok: true }, { status: 201 });
  });
  await route(post(KEY));
  assert.equal(runs, 1);
});

test("a thrown error is not kept, so the retry runs the route again", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    if (runs === 1) throw new Error("connection reset");
    return Response.json({ ok: true }, { status: 201 });
  });
  await assert.rejects(route(post(KEY)), /connection reset/);
  assert.equal(store.rows.size, 0);
  const retry = await route(post(KEY));
  assert.equal(retry.status, 201);
  assert.equal(runs, 2);
});

test("a server error answer is not kept, so the retry runs the route again", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({ error: "db down" }, { status: runs === 1 ? 500 : 201 });
  });
  assert.equal((await route(post(KEY))).status, 500);
  assert.equal((await route(post(KEY))).status, 201);
  assert.equal(runs, 2);
});

test("a malformed key is ignored rather than trusted", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({}, { status: 201 });
  });
  await route(post("short"));
  await route(post("short"));
  assert.equal(runs, 2);
  assert.equal(store.rows.size, 0);
});

test("the same key on a different route is a different change", async () => {
  const store = memoryStore();
  let runs = 0;
  const route = idempotent(store, async () => {
    runs += 1;
    return Response.json({}, { status: 201 });
  });
  await route(post(KEY, "http://localhost/api/khata/payments"));
  await route(post(KEY, "http://localhost/api/attendant/khata-entries"));
  assert.equal(runs, 2);
});

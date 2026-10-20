// Verifies duplicate protection against a real MongoDB. It seeds a fresh database, signs in through the real login
// routes, sends the same request again (sequentially and in parallel, as a retry or double tap would), and counts what
// MongoDB actually stores. Each run uses a new database and drops it at the end.
const crypto = require("crypto");
const { MongoClient, ObjectId } = require((process.env.MONGO_MODULE_DIR || require("path").join(__dirname, "../../node_modules")) + "/mongodb");

const BASE = process.env.BASE_URL || "http://localhost:3130";
const URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018";
const DB_NAME = process.env.DB_NAME || "pms_verify";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  return `${salt}:${crypto.createHmac("sha256", salt).update(password).digest("hex")}`;
}

// Calls the running app. Returns the status and body, and the session cookie if one was set.
async function call(path, { method = "POST", json, form, cookie, key, clientTime } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (key) headers["Idempotency-Key"] = key;
  if (clientTime) headers["X-Client-Time"] = clientTime;
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const response = await fetch(BASE + path, { method, headers, body, redirect: "manual" });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  const setCookie = response.headers.getSetCookie();
  return { status: response.status, data, setCookie };
}

function cookieFrom(setCookie, name) {
  const found = setCookie.find((c) => c.startsWith(`${name}=`));
  return found ? found.split(";")[0] : null;
}

(async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);

  try {
    // ---- Seed: a pump with an owner login, a second pump, an attendant, a khata client, today's fuel rates
    const pumpId = new ObjectId();
    const otherPumpId = new ObjectId();
    const ownerPassword = "OwnerPass123";
    const attendantPassword = "AttendantPass123";
    await db.collection("pumps").insertMany([
      { _id: pumpId, name: "Verify PSO", ownerName: "Ali", ownerEmail: "ali@verifypso", ownerPasswordHash: hashPassword(ownerPassword), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: new Date() },
      { _id: otherPumpId, name: "Other Pump", ownerName: "Sara", ownerEmail: "sara@other", ownerPasswordHash: hashPassword("OtherPass123"), role: "pump-owner", status: "Online", accountStatus: "active", createdAt: new Date() },
    ]);
    await db.collection("pump_employees").insertOne({ pumpId, name: "Attendant", username: "att@verifypso", passwordHash: hashPassword(attendantPassword), role: "pump-attendant", shiftHours: 8, createdAt: new Date() });
    await db.collection("fuel_rates").insertOne({ pumpId, petrolRate: 300, dieselRate: 310, date: new Date(), createdAt: new Date() });
    const clientId = new ObjectId();
    await db.collection("khataClients").insertOne({ _id: clientId, pumpId, clientName: "Test Client", department: "Ops", phone: "0300", username: "test-client", totalFuelAmount: 0, remainingBalance: 0, petrolGivenRate: 280, dieselGivenRate: 290, createdAt: new Date() });

    // ---- Sign in through the real routes
    const owner = await call("/api/pump-owner/login", { json: { email: "ali@verifypso", password: ownerPassword } });
    const ownerCookie = cookieFrom(owner.setCookie, "pump_owner_session");
    check("owner sign-in works (test setup)", owner.status === 200 && Boolean(ownerCookie), `status ${owner.status}`);

    const attendant = await call("/api/auth/employee-login", { json: { username: "att@verifypso", password: attendantPassword } });
    const attendantCookie = cookieFrom(attendant.setCookie, "employee_session");
    check("attendant sign-in works (test setup)", attendant.status === 200 && Boolean(attendantCookie), `status ${attendant.status} ${JSON.stringify(attendant.data).slice(0, 120)}`);

    // ---- 1. Fuel entries (attendant): the same key repeated, sequential and parallel
    const entryKey = "entry-key-0001-verify";
    const entryBody = { khataClientId: clientId.toString(), fuelType: "Petrol", litres: 10, vehicleNumber: "LEA-101", driverName: "Driver", givenRate: 280 };
    const sequential = [];
    for (let i = 0; i < 3; i++) sequential.push(await call("/api/attendant/khata-entries", { json: entryBody, cookie: attendantCookie, key: entryKey }));
    const parallel = await Promise.all(Array.from({ length: 6 }, () => call("/api/attendant/khata-entries", { json: entryBody, cookie: attendantCookie, key: entryKey })));
    const entryStatuses = [...sequential, ...parallel].map((r) => r.status);
    check("fuel entry: every repeat is answered without an error", entryStatuses.every((s) => s === 200), entryStatuses.join(","));
    const storedEntries = await db.collection("khataEntries").countDocuments({ clientRequestId: entryKey });
    check("fuel entry: MongoDB stores exactly one record for the key (9 requests)", storedEntries === 1, `stored ${storedEntries}`);
    let client1 = await db.collection("khataClients").findOne({ _id: clientId });
    check("fuel entry: the client total is added once (2800)", client1.totalFuelAmount === 2800 && client1.remainingBalance === 2800, `total ${client1.totalFuelAmount}, remaining ${client1.remainingBalance}`);

    const otherKey = await call("/api/attendant/khata-entries", { json: entryBody, cookie: attendantCookie, key: "entry-key-0002-verify" });
    client1 = await db.collection("khataClients").findOne({ _id: clientId });
    check("fuel entry: a different key is a new entry (not a false duplicate)", otherKey.status === 200 && client1.totalFuelAmount === 5600, `total ${client1.totalFuelAmount}`);

    // ---- 2. Owner payments: the same key repeated, sequential and parallel
    const payKey = "pay-key-0001-verify";
    const payBody = { khataClientId: clientId.toString(), amountReceived: 1000, advancePaid: 0, method: "cash", note: "verify" };
    const paySeq = [];
    for (let i = 0; i < 3; i++) paySeq.push(await call("/api/khata/payments", { json: payBody, cookie: ownerCookie, key: payKey }));
    const payPar = await Promise.all(Array.from({ length: 6 }, () => call("/api/khata/payments", { json: payBody, cookie: ownerCookie, key: payKey })));
    const payStatuses = [...paySeq, ...payPar].map((r) => r.status);
    check("payment: every repeat is answered without an error", payStatuses.every((s) => s === 200), payStatuses.join(","));
    const storedPays = await db.collection("khataPayments").countDocuments({ clientRequestId: payKey });
    check("payment: MongoDB stores exactly one payment for the key (9 requests)", storedPays === 1, `stored ${storedPays}`);
    const allPays = await db.collection("khataPayments").find({ khataClientId: clientId }).toArray();
    const paid = allPays.reduce((sum, p) => sum + (Number(p.amountReceived) || 0), 0);
    check("payment: the amount is counted once (1000)", paid === 1000, `counted ${paid}`);

    // A cheque with the same number and bank is refused, even under a new key
    const chequeBody = { khataClientId: clientId.toString(), amountReceived: 500, advancePaid: 0, method: "cheque", chequeNumber: "CHQ-77", chequeDate: "2026-10-10", bankName: "HBL", note: "verify" };
    const cheque1 = await call("/api/khata/payments", { json: chequeBody, cookie: ownerCookie, key: "cheque-key-0001-verify" });
    const cheque2 = await call("/api/khata/payments", { json: chequeBody, cookie: ownerCookie, key: "cheque-key-0002-verify" });
    check("cheque: the same cheque is refused a second time under a new key", cheque1.status === 200 && cheque2.status === 409, `first ${cheque1.status}, second ${cheque2.status}`);
    const chequeStored = await db.collection("khataPayments").countDocuments({ method: "cheque", "details.chequeNumber": "CHQ-77" });
    check("cheque: MongoDB holds one cheque record", chequeStored === 1, `stored ${chequeStored}`);

    // A queued status change applies once, and an old queued decision never overrides a newer one
    const chequeRow = await db.collection("khataPayments").findOne({ method: "cheque", "details.chequeNumber": "CHQ-77" });
    const statusUrl = `/api/khata/payments/${chequeRow._id}/status`;
    const verifyChange = await call(statusUrl, { json: { to: "confirmed", reason: "bank statement", expectedFrom: "pending" }, cookie: ownerCookie });
    check("status: a queued verify applies to a pending cheque", verifyChange.status === 200 && verifyChange.data?.status === "confirmed", `status ${verifyChange.status}, was ${chequeRow.status}`);
    const statusReplay = await call(statusUrl, { json: { to: "confirmed", reason: "bank statement", expectedFrom: "pending" }, cookie: ownerCookie });
    check("status: a replay of the same verify is answered as done", statusReplay.status === 200 && statusReplay.data?.alreadyApplied === true, `status ${statusReplay.status}`);
    const staleBounce = await call(statusUrl, { json: { to: "bounced", reason: "old queued bounce", expectedFrom: "pending" }, cookie: ownerCookie });
    const afterStale = await db.collection("khataPayments").findOne({ _id: chequeRow._id });
    check("status: an old queued bounce is refused after the cheque was confirmed", staleBounce.status === 409 && afterStale.status === "confirmed", `status ${staleBounce.status}, stored ${afterStale.status}`);
    const confirmations = (afterStale.statusHistory ?? []).filter((h) => h.to === "confirmed").length;
    check("status: the verify is recorded once in the history, not repeated", confirmations === 1, `confirmed entries ${confirmations}`);
    const unknownFrom = await call(statusUrl, { json: { to: "bounced", reason: "x", expectedFrom: "cleared" }, cookie: ownerCookie });
    check("status: an unknown current status is refused", unknownFrom.status === 400, `status ${unknownFrom.status}`);

    // ---- 3. Meter readings: the same start reading repeated (sequential and parallel)
    const meterBody = { type: "start", fuelType: "petrol", reading: 1200, photoDataUrl: "data:image/jpeg;base64,AAAA" };
    const meterSeq = [];
    for (let i = 0; i < 3; i++) meterSeq.push(await call("/api/meter-readings", { json: meterBody, cookie: attendantCookie }));
    const meterPar = await Promise.all(Array.from({ length: 4 }, () => call("/api/meter-readings", { json: meterBody, cookie: attendantCookie })));
    const meterStatuses = [...meterSeq, ...meterPar].map((r) => r.status);
    check("meter reading: every repeat is answered", meterStatuses.every((s) => s === 200), meterStatuses.join(","));
    const meterCount = await db.collection("meterReadings").countDocuments({ type: "start", fuelType: "petrol" });
    check("meter reading: MongoDB holds one start reading for the shift", meterCount === 1, `stored ${meterCount}`);

    // ---- 4. Owner sales: the same day and shift sent repeatedly
    const saleBody = { date: new Date().toISOString().slice(0, 10), shift: "morning", petrolLitres: 100, dieselLitres: 50, cashRevenue: 30000, cardRevenue: 5000 };
    const saleSeq = [];
    for (let i = 0; i < 3; i++) saleSeq.push(await call("/api/pump-owner/sales", { json: saleBody, cookie: ownerCookie }));
    const salePar = await Promise.all(Array.from({ length: 4 }, () => call("/api/pump-owner/sales", { json: saleBody, cookie: ownerCookie })));
    const saleStatuses = [...saleSeq, ...salePar].map((r) => r.status);
    check("sales: every repeat is answered", saleStatuses.every((s) => s === 200 || s === 201), saleStatuses.join(","));
    const saleCount = await db.collection("sales").countDocuments({ pumpId, date: saleBody.date, shift: "morning" });
    check("sales: MongoDB holds one row per day and shift", saleCount === 1, `stored ${saleCount}`);

    {
    // Sales versions: a late queued retry (made before the saved entry) cannot overwrite a newer correction, and a repeat
    // of a saved request is not applied twice. Uses the evening shift, which the checks above do not touch.
    const day = new Date().toISOString().slice(0, 10);
    const eveningSale = (petrolLitres) => ({ date: day, shift: "evening", petrolLitres, dieselLitres: 10, cashRevenue: 1000, cardRevenue: 500 });
    const timeAgo = (ms) => new Date(Date.now() - ms).toISOString();
    const storedEvening = () => db.collection("sales").findOne({ pumpId, date: day, shift: "evening" });
    const newer = await call("/api/pump-owner/sales", { json: eveningSale(200), cookie: ownerCookie, key: "sale-newer-key-verify", clientTime: timeAgo(1000) });
    check("sales version: a correction made at 1 s ago is saved", newer.status === 201, `status ${newer.status}`);
    const stale = await call("/api/pump-owner/sales", { json: eveningSale(999), cookie: ownerCookie, key: "sale-stale-key-verify", clientTime: timeAgo(5000) });
    const afterStale = await storedEvening();
    check("sales version: a late queued retry is refused with 409", stale.status === 409 && stale.data?.code === "superseded", `status ${stale.status}`);
    check("sales version: the newer correction is not overwritten", afterStale.petrolLitres === 200, `stored ${afterStale.petrolLitres}`);
    const replay = await call("/api/pump-owner/sales", { json: eveningSale(200), cookie: ownerCookie, key: "sale-newer-key-verify", clientTime: timeAgo(1000) });
    check("sales version: a repeat of a saved change is answered as done", replay.status === 201 && replay.data?.replayed === true, `status ${replay.status}`);
    const later = await call("/api/pump-owner/sales", { json: eveningSale(250), cookie: ownerCookie, key: "sale-later-key-verify", clientTime: timeAgo(100) });
    check("sales version: a change made after the saved one is applied", later.status === 201 && (await storedEvening()).petrolLitres === 250, `status ${later.status}`);
    const eveningRows = await db.collection("sales").countDocuments({ pumpId, date: day, shift: "evening" });
    check("sales version: still one row for the shift", eveningRows === 1, `stored ${eveningRows}`);
    }

    // ---- 5. Connect chat: a message sent repeatedly with one key, after the two pumps are connected
    await db.collection("pump_friend_requests").insertOne({ senderId: pumpId, receiverId: otherPumpId, senderName: "Verify PSO", receiverName: "Other Pump", status: "accepted", createdAt: new Date() });
    const msgKey = "msg-key-0001-verify";
    const msgBody = { kind: "pump", with: otherPumpId.toString(), body: "hello from verify" };
    const msgSeq = [];
    for (let i = 0; i < 3; i++) msgSeq.push(await call("/api/pumpadmin/connect/messages", { json: msgBody, cookie: ownerCookie, key: msgKey }));
    const msgPar = await Promise.all(Array.from({ length: 4 }, () => call("/api/pumpadmin/connect/messages", { json: msgBody, cookie: ownerCookie, key: msgKey })));
    const msgStatuses = [...msgSeq, ...msgPar].map((r) => r.status);
    check("chat message: every repeat is answered", msgStatuses.every((s) => s === 201 || s === 200), msgStatuses.join(","));
    const msgStored = await db.collection("connect_messages").countDocuments({ clientRequestId: msgKey });
    check("chat message: MongoDB stores exactly one message for the key", msgStored === 1, `stored ${msgStored}`);
    const msgTotal = await db.collection("connect_messages").countDocuments({ body: "hello from verify" });
    check("chat message: the chat holds one copy of the message", msgTotal === 1, `stored ${msgTotal}`);
    // ---- 6. Attendant shift start and end with a photo: the same key repeated
    const shiftForm = (fields) => {
      const f = new FormData();
      for (const [k, v] of Object.entries(fields)) f.append(k, v);
      f.append("photo", new Blob([Buffer.from("AAAA")], { type: "image/png" }), "meter.png");
      return f;
    };
    const startKey = "shift-start-key-verify";
    const startForm = () => shiftForm({ fuelType: "Petrol", reading: "1200", nozzle: "2" });
    const startCalls = [];
    for (let i = 0; i < 3; i++) startCalls.push(await fetch(BASE + "/api/attendant/shifts/start", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": startKey }, body: startForm() }));
    const startPar = await Promise.all(Array.from({ length: 4 }, () => fetch(BASE + "/api/attendant/shifts/start", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": startKey }, body: startForm() })));
    const startStatuses = [...startCalls, ...startPar].map((r) => r.status);
    check("shift start: every repeat is answered without an error", startStatuses.every((s) => s === 200), startStatuses.join(","));
    const startStored = await db.collection("shifts").countDocuments({ clientRequestId: startKey });
    check("shift start: MongoDB stores exactly one shift for the key (7 requests)", startStored === 1, `stored ${startStored}`);

    const endKey = "shift-end-key-verify";
    const endCalls = [];
    for (let i = 0; i < 3; i++) endCalls.push(await fetch(BASE + "/api/attendant/shifts/end", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": endKey }, body: shiftForm({ reading: "1500" }) }));
    const endPar = await Promise.all(Array.from({ length: 4 }, () => fetch(BASE + "/api/attendant/shifts/end", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": endKey }, body: shiftForm({ reading: "1500" }) })));
    const endStatuses = [...endCalls, ...endPar].map((r) => r.status);
    check("shift end: every repeat is answered without an error", endStatuses.every((s) => s === 200), endStatuses.join(","));
    const closed = await db.collection("shifts").find({ startReading: 1200 }).toArray();
    check("shift end: the shift is closed once, with the end reading and the litres", closed.length === 1 && closed[0].endReading === 1500 && closed[0].litresSold === 300, `shifts ${closed.length}`);
    const plainEnd = await fetch(BASE + "/api/attendant/shifts/end", { method: "POST", headers: { Cookie: attendantCookie }, body: shiftForm({ reading: "1600" }) });
    check("shift end without a key on a closed shift is still refused (409 or 404)", plainEnd.status === 409 || plainEnd.status === 404, `status ${plainEnd.status}`);

    // ---- 7. Shift amounts use the rate saved on the shift, not the rate at the time of the sync
    const firstShift = await db.collection("shifts").findOne({ startReading: 1200 });
    check("shift amount: petrol shift priced at the rate in effect when it started (300 x 300 litres)", firstShift && firstShift.amount === 90000, `amount ${firstShift && firstShift.amount}`);
    // The rates of the day change, as they would before a later sync
    await db.collection("fuel_rates").updateMany({ pumpId }, { $set: { petrolRate: 999, dieselRate: 999 } });
    const dStart = await fetch(BASE + "/api/attendant/shifts/start", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": "shift-diesel-key-verify" }, body: shiftForm({ fuelType: "Diesel", reading: "2000", nozzle: "1", petrolRate: "300", dieselRate: "310" }) });
    check("diesel shift: started with the device rates", dStart.status === 200, `status ${dStart.status}`);
    const dStored = await db.collection("shifts").findOne({ startReading: 2000 });
    check("diesel shift: the start rates are saved on the shift (310 diesel)", dStored && dStored.startDieselRate === 310 && dStored.startPetrolRate === 300, dStored ? `${dStored.startPetrolRate}/${dStored.startDieselRate}` : "no shift");
    const dEnd = await fetch(BASE + "/api/attendant/shifts/end", { method: "POST", headers: { Cookie: attendantCookie, "Idempotency-Key": "shift-diesel-end-verify" }, body: shiftForm({ reading: "2100" }) });
    const dEnded = await db.collection("shifts").findOne({ startReading: 2000 });
    check("diesel shift: priced with the saved diesel rate (100 litres x 310), not the changed rate", dEnd.status === 200 && dEnded && dEnded.amount === 31000, `status ${dEnd.status}, amount ${dEnded && dEnded.amount}`);
    check("diesel shift: the rate used is recorded on the shift", dEnded && dEnded.rateUsed === 310, `rate ${dEnded && dEnded.rateUsed}`);

    // ---- 8. Client payment submission and shift hours: repeated requests change nothing extra
    await db.collection("khataClients").updateOne({ _id: clientId }, { $set: { passwordHash: hashPassword("ClientPass1") } });
    const clientLogin = await call("/api/auth/login", { json: { username: "test-client", password: "ClientPass1" } });
    const clientCookie = cookieFrom(clientLogin.setCookie, "khata_client_session");
    check("client sign-in works (test setup)", clientLogin.status === 200 && Boolean(clientCookie), `status ${clientLogin.status}`);
    const clientPayKey = "client-pay-key-verify";
    const clientBody = { method: "cash", amountReceived: 500, advancePaid: 0, note: "from client", clientRequestId: clientPayKey };
    const clientCalls = [];
    for (let i = 0; i < 3; i++) clientCalls.push(await call("/api/khata/client/payments", { json: clientBody, cookie: clientCookie }));
    const clientPar = await Promise.all(Array.from({ length: 4 }, () => call("/api/khata/client/payments", { json: clientBody, cookie: clientCookie })));
    const clientStatuses = [...clientCalls, ...clientPar].map((r) => r.status);
    check("client payment: every repeat is answered", clientStatuses.every((s) => s === 200 || s === 201), clientStatuses.join(","));
    const clientStored = await db.collection("khataPayments").countDocuments({ clientRequestId: clientPayKey });
    check("client payment: MongoDB stores exactly one record for the key (7 requests)", clientStored === 1, `stored ${clientStored}`);

    const employeeId = (await db.collection("pump_employees").findOne({ username: "att@verifypso" }))._id;
    const hoursCalls = [];
    for (let i = 0; i < 3; i++) hoursCalls.push(await call(`/api/pumpadmin/employees/${employeeId}`, { method: "PUT", json: { shiftHours: 10 }, cookie: ownerCookie }));
    const hoursStatuses = hoursCalls.map((r) => r.status);
    const hoursDoc = await db.collection("pump_employees").findOne({ _id: employeeId });
    check("shift hours: a repeated change leaves the value as set (10)", hoursStatuses.every((s) => s === 200) && hoursDoc.shiftHours === 10, `statuses ${hoursStatuses.join(",")}, value ${hoursDoc.shiftHours}`);

    // ---- 9. Proof images for saved payments: the same key repeated stores one image and links it
    const ownerPay = await db.collection("khataPayments").findOne({ clientRequestId: payKey });
    const proofBlob = () => { const f = new FormData(); f.append("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "proof.png"); return f; };
    const ownerProofKey = "owner-proof-key-verify";
    const ownerProofCalls = [];
    for (let i = 0; i < 3; i++) ownerProofCalls.push(await fetch(BASE + `/api/khata/payments/${ownerPay._id}/proof`, { method: "POST", headers: { Cookie: ownerCookie, "Idempotency-Key": ownerProofKey }, body: proofBlob() }));
    const ownerProofPar = await Promise.all(Array.from({ length: 3 }, () => fetch(BASE + `/api/khata/payments/${ownerPay._id}/proof`, { method: "POST", headers: { Cookie: ownerCookie, "Idempotency-Key": ownerProofKey }, body: proofBlob() })));
    const ownerProofStatuses = [...ownerProofCalls, ...ownerProofPar].map((r) => r.status);
    check("owner proof: every repeat is answered", ownerProofStatuses.every((s) => s === 200), ownerProofStatuses.join(","));
    const ownerProofRows = await db.collection("khataAttachments").countDocuments({ clientRequestId: ownerProofKey });
    check("owner proof: MongoDB stores one image for the key (6 requests)", ownerProofRows === 1, `stored ${ownerProofRows}`);
    const ownerLinked = await db.collection("khataPayments").findOne({ _id: ownerPay._id });
    check("owner proof: the payment links to that image", ownerLinked && ownerLinked.attachmentId != null, `link ${ownerLinked && ownerLinked.attachmentId}`);

    const clientPay = await db.collection("khataPayments").findOne({ clientRequestId: clientPayKey });
    const clientProofKey = "client-proof-key-verify";
    const clientProofCalls = [];
    for (let i = 0; i < 3; i++) clientProofCalls.push(await fetch(BASE + `/api/khata/client/payments/${clientPay._id}/proof`, { method: "POST", headers: { Cookie: clientCookie, "Idempotency-Key": clientProofKey }, body: proofBlob() }));
    const clientProofStatuses = clientProofCalls.map((r) => r.status);
    check("client proof: every repeat is answered", clientProofStatuses.every((s) => s === 200), clientProofStatuses.join(","));
    const clientProofRows = await db.collection("khataAttachments").countDocuments({ clientRequestId: clientProofKey });
    check("client proof: MongoDB stores one image for the key", clientProofRows === 1, `stored ${clientProofRows}`);

  } catch (error) {
    check("verification ran to the end", false, error.message);
  } finally {
    await db.dropDatabase();
    await client.close();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed} passed, ${failed} failed (database ${DB_NAME} dropped)`);
    process.exit(failed ? 1 : 0);
  }
})();

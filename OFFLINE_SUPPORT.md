# Offline support

Branch `offline-phase1`. Not merged into `main`, not deployed.

Written for: engineers maintaining the app and the offline queue.

## What works offline

- **Pages.** A page the person opened while online opens offline. A page never opened shows the offline page (`public/offline.html`).
- **Read data.** The module reads listed in `CACHED_API` in `public/sw.js` keep their last synced values: dashboard figures, sales history, khata accounts, entries, payments and months, shifts and attendance, fuel orders, employees and payments.
- **Queued writes.** These are saved on the device when the connection is down and sent once, in order, when it returns:
  - Sales: `POST /api/pump-owner/sales`
  - Fuel orders: `POST /api/pump-owner/fuel-orders`
  - Shifts: `POST /api/attendant/shifts/start` and `/end` (with photos)
  - Khata entries: `POST /api/attendant/khata-entries`
  - Payments: `POST /api/khata/payments` and `POST /api/khata/client/payments`
  - Proof images: `POST /api/khata/payments/{id}/proof`. A proof for a payment that is still queued waits for that payment and is sent with its saved id.
  - Employee shift hours: `PUT /api/pumpadmin/employees/{id}` (an absolute value, so a replay is harmless). Pumpadmin employees and staff screens.
- **Status.** A small pill at the bottom right shows "You are offline", the number of changes waiting, or the changes the server refused (with Review and Discard). It is hidden while online with nothing waiting.

## What stays online, and why

- **Money state changes.** Payment status (verify, clear, bounce), payment edits, deletes and month close. Each acts on a record another action depends on. A replay could override a newer decision. These need a precondition on the server first (see the reverted phase 5 notes in git history for one approach).
- **Credentials and accounts.** Logins, password changes and resets, account creation, employee, driver and supplier creation (these return a one-time password), employee deletion, and enable or disable.
- **Other parties.** Truck location, driver and supplier answers, supplier requests, cancellations, chat, notifications and connect.
- **Server-action forms on the legacy attendant and cashier dashboards** (`/attendant/dashboard`, `/cashier/dashboard`). They record shifts and sales in the server's in-memory store (`src/lib/storage/localStorage-service.ts`), not in MongoDB. There is nothing in the database to sync, so they are not queued. See "Decisions needed".
- **Inventory and Reports** have no write screens on this branch. Their pages are server-rendered from the database and demo data. Offline they show the snapshot of the last visit; a new date range or filter needs the network.
- **Not covered.** HR and payroll, admin pages and the legacy `/api/admin/legacy/*` routes. `/api/meter-readings` has no client caller.

## Safety rules

- **Each change has a key.** A queued change is sent with an `Idempotency-Key`. The server keeps the first answer for 7 days (collection `offline_answers`, created on first use). A repeat with the same key gets that answer and the route does not run again, so a retry after a dropped connection cannot save a second sale or payment.
- **Account scope.** A change belongs to the account that was signed in when it was made. The scope is a SHA-256 digest of the session cookie values (`src/lib/offline/scope.ts`), not the cookies. A change is sent only while that same account is signed in; otherwise it waits.
- **Refusals are kept.** A 400, 404 or 409 answer (for example a closed month) keeps the change for review with the server's message. It is not retried blindly, and it is removed only when the person discards it.
- **Caches are cleared.** Sign-in pages and any change of account clear the offline page and data caches.

## Limits

- Queued changes are sent only while the app is open in a browser tab. There is no background sync.
- Offline screens show the last synced totals. Totals are not recalculated offline, and a queued change does not show in server totals until it is sent.
- **Times.** A sale carries the day shown on its page, so one entered before midnight and sent after it keeps its day. Shift start and end times, and khata entry dates, are recorded when the change reaches the server, not when it was made. A change queued for a while therefore shows the later time. Fixing this needs the server to accept the time the change was made, with checks; it is not done in this phase.
- **Repeated writes after a failure.** The key stops a repeat of a saved answer. It cannot undo a write that the server made before it failed. Two cases can repeat a write: (1) a request fails after it saved its record but before the answer was stored; the stored claim is taken over after 2 minutes, so the retry runs again; (2) a route fails with a 5xx after part of its change was saved; the claim is released so the retry runs. Both are rare. Each route's own writes are not transactional with the answer store. A transaction across both collections would close this.
- Cached API data stays in the browser's Cache Storage on that device until a sign-in page is opened or the account changes. On a shared device, sign out and sign in again before handing it over.
- The service worker and the install prompt work only in production builds (`next build` then `next start`). Development does not register the service worker.

## Files

- `public/sw.js`: service worker (cache rules, `CACHED_API`).
- `public/offline.html`: offline fallback page.
- `src/app/manifest.ts`, `public/icons/`: install metadata and icons.
- `src/lib/offline/rules.ts`: which writes are queued, and what a server answer means.
- `src/lib/offline/outbox.ts`: IndexedDB outbox, `offlineFetch`, `syncOutbox`.
- `src/lib/offline/scope.ts` and `src/app/api/offline/scope/route.ts`: account scope.
- `src/lib/offline/idempotency.ts` (pure) and `src/lib/offline/with-idempotency.ts` (MongoDB store): server side of the keys. The eight queued POST routes are wrapped with `withIdempotency`.
- `src/components/offline/OfflineProvider.tsx`: status pill, sync triggers, service worker registration.

## Tests

- `node --test scripts/*.test.mjs`: 108 tests, including `offline-rules.test.mjs` (queue rules, answers, scope) and `offline-idempotency.test.mjs` (keyed replays, retries, stale claims, sign-in and busy answers not kept).
- **MongoDB, verified on a throwaway local database.** MongoDB 7.0.24 (`mongodb-memory-server`, 127.0.0.1 only; not Atlas and not a shared staging database). The production build ran against it and the keyed routes were exercised over HTTP: a keyed sale sent twice saved once; a keyed shift start sent twice, and sent twice at the same moment, added one shift; without a key the same route still writes each time; a keyed employee shift-hours update replayed its first answer; a refusal was kept and replayed; a request keyed while signed out was not kept, so the same key works after sign-in; the 7-day TTL index exists; no claim was left running.
- **Screens, in headless Edge against that server.** Employees: the list and page load offline from cache. Employees: a shift-hours edit saved while offline does not reach the database, shows the offline status, and is sent once when the network returns. Inventory (fuel stock) and Reports: both render from cache with the server stopped.
- **Outbox in the browser** (fake network): sales, retries, refusals, payment-then-proof, other-account holds, empty-scope refusal, employee update, and the service worker's offline fallback.
- Browser checks, run in headless Edge against `next start` of the production build, with the outbox running on a fake network: a queued sale is sent once with its key; a retry keeps its key and order; a refused change stays for review and can be discarded; a payment's proof waits for the payment and is sent to the saved id; a change from another account is not sent; the service worker serves cached pages and the offline page when the server is stopped.
- Not run here: the configured Atlas cluster and any shared staging database. Test writes would change live data, and no staging database was available. Repeat the MongoDB checks on staging before any release.

## Decisions needed

- **Legacy server-action forms** (`/attendant/dashboard` shift and dispense forms, and the cashier forms). These write to the server's in-memory store, so there is no MongoDB record to sync. To make them offline-capable, they must first write to MongoDB, which changes where their data lives. Choose: (a) move them to the MongoDB attendant and sales routes, then queue them like the other forms; or (b) leave them online-only as they are now.
- **Employee creation and deletion** stay online. Creation returns a generated password once, which cannot be shown for a change made offline. A deletion should not be replayed later without a confirmation step.

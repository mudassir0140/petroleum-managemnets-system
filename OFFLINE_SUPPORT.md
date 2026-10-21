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
- **Status.** A small pill at the bottom right shows "You are offline", the number of changes waiting, or the changes the server refused (with Review and Discard). It is hidden while online with nothing waiting.

## What stays online, and why

- **Money state changes.** Payment status (verify, clear, bounce), payment edits, deletes and month close. Each acts on a record another action depends on. A replay could override a newer decision. These need a precondition on the server first (see the reverted phase 5 notes in git history for one approach).
- **Credentials and accounts.** Logins, password changes and resets, account creation, employee, driver and supplier creation (these return a one-time password), and enable or disable.
- **Other parties.** Truck location, driver and supplier answers, supplier requests, cancellations, chat, notifications and connect.
- **Not yet covered.** Inventory and meter-reading writes, HR and payroll, admin pages, and the legacy `/api/admin/legacy/*` routes. Their pages show the cached version only if they were opened before.

## Safety rules

- **Each change has a key.** A queued change is sent with an `Idempotency-Key`. The server keeps the first answer for 7 days (collection `offline_answers`, created on first use). A repeat with the same key gets that answer and the route does not run again, so a retry after a dropped connection cannot save a second sale or payment.
- **Account scope.** A change belongs to the account that was signed in when it was made. The scope is a SHA-256 digest of the session cookie values (`src/lib/offline/scope.ts`), not the cookies. A change is sent only while that same account is signed in; otherwise it waits.
- **Refusals are kept.** A 400, 404 or 409 answer (for example a closed month) keeps the change for review with the server's message. It is not retried blindly, and it is removed only when the person discards it.
- **Caches are cleared.** Sign-in pages and any change of account clear the offline page and data caches.

## Limits

- Queued changes are sent only while the app is open in a browser tab. There is no background sync.
- Offline screens show the last synced totals. Totals are not recalculated offline, and a queued change does not show in server totals until it is sent.
- **Times.** A sale carries the day shown on its page, so one entered before midnight and sent after it keeps its day. Shift start and end times, and khata entry dates, are recorded when the change reaches the server, not when it was made. A change queued for a while therefore shows the later time. Fixing this needs the server to accept the time the change was made, with checks; it is not done in this phase.
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

- `node --test scripts/*.test.mjs`: 105 tests, including `offline-rules.test.mjs` (queue rules, answers, scope) and `offline-idempotency.test.mjs` (keyed replays, retries, stale claims).
- Browser checks, run in headless Edge against `next start` of the production build, with the outbox running on a fake network: a queued sale is sent once with its key; a retry keeps its key and order; a refused change stays for review and can be discarded; a payment's proof waits for the payment and is sent to the saved id; a change from another account is not sent; the service worker serves cached pages and the offline page when the server is stopped.
- Not run here: the MongoDB answer store (`with-idempotency.ts`) against a real database. It was not run against the configured Atlas cluster, because test writes would change live data. Check one queued sale and one replay on a staging database before release.

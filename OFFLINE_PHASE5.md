# Offline Phase 5: queued payment status changes

Branch `offline-phase1`. Not merged into `main`, not deployed.

Written for: engineers maintaining the offline queue and the khata payment code.

## Review of the existing offline work

- The queue (`src/lib/offline/outbox.ts`), its rules (`src/lib/offline/rules.ts`) and the server keys are sound for every queued write listed in `offline-audit.md`. Each queued write either has a server-side unique key or always lands on the same record.
- Gap found: the khata status route (`POST /api/khata/payments/[id]/status`) accepted any target status with no check of the state the owner saw. A queued "confirmed" replayed after another owner had bounced the same payment would have overridden that newer decision. This is why status changes were left online-only in Phase 1.
- Gap found: the status button used a plain `fetch`, so it could not be queued at all.

## Scope of Phase 5

Queue the verify, clear and bounce actions on a khata payment, with a precondition that makes a replay safe.

1. **Precondition.** The change carries `expectedFrom`, the status the owner saw. The server applies it only if:
   - the payment is still in `expectedFrom`: apply it;
   - the payment is already in the target status: report success and change nothing (the earlier attempt went through);
   - anything else: refuse with 409, so the queued change is kept for review and never overwrites a newer decision.
   Without `expectedFrom` the route behaves exactly as before.
2. **Rule.** `POST /api/khata/payments/{24-hex id}/status` is queueable. Other ids are not.
3. **UI.** The status buttons in the monthly khata panel use the offline-aware fetch and send `expectedFrom`. When queued, they show the same "saved on this device" message as payments. The UI itself is otherwise unchanged.

### Behaviour change to note

A status change made from a page that is out of date (the payment changed on another device) now returns a 409 with the message "This payment changed after you made this change. Reload and check its status." Before, it applied if the transition was still allowed from the current state. This is intentional: it is the safe behaviour the queue needs.

### Files changed

- `src/lib/khata/payments.ts`: `statusPrecondition()`, a pure rule.
- `src/lib/khata/transactions.ts`: `setPaymentStatus` applies the precondition before the transition check.
- `src/app/api/khata/payments/[id]/status/route.ts`: validates `expectedFrom`, returns `alreadyApplied`.
- `src/lib/offline/rules.ts`: the queue rule.
- `src/components/khata/MonthlyKhataPanel.tsx`: `changeStatus` uses `offlineFetch`.
- `scripts/offline-rules-phase5.test.mjs`: 5 tests.

## Online-only operations after Phase 5

Each entry says why it stays online, or what would be needed to queue it later.

**Credentials (stay online).** A queued password would sit in browser storage. Pump owner, employee and khata-client logins, password resets and changes, supplier and driver creation (returns a password once), supplier password reveal, and account enable/disable/reset.

**Live or other-party state (stay online).**
- Truck live location: a stale position must never be replayed.
- Driver and supplier answers (accept, reject, confirm delivery), pump-to-pump requests, supplier fuel requests and orders, cancellations, truck assignment: these change state the other party acts on. A precondition could work for some of them, but they need a design of their own. Not in Phase 5.

**Money and pricing rules (stay online for now).**
- Payment edits (`PUT /api/khata/payments/[id]`): a replay sets absolute values, so each field would need its own precondition. Candidate for a later phase.
- Fuel rate changes: a replayed rate could go live hours after the owner decided it. Needs an owner decision on whether offline pricing is allowed at all.
- Month close and reopen: financial lock, online only.

**Destructive or administrative (never queued).** All deletes, all `/admin/*` pages, and legacy `/api/admin/legacy/*` routes.

**Session (never queued).** Sign-in, sign-out, switching the active pump.

## Limitations (unchanged)

- A queued change is sent only while the app is open.
- A queued status change is refused, not merged, when the payment has moved on. The owner sees it under "could not be saved" and must redo it.
- Live balances show their last synced value offline.

## Tests

- `node --test` on all 15 files in `scripts/`: 105 of 105 pass, including the 5 new ones.
- `tsc --noEmit`: passes. `eslint` on the changed files: no errors.
- `next build --webpack`: passes.
- `e2e/offline/outbox-test.cjs` (Edge, stub API): 19 of 19 pass.
- Not run here: the database checks (`verify-db.cjs`), logged-in browser flows and the service worker test. They need MongoDB, which is not installed in this environment. The status precondition on a real database should be checked by `verify-db.cjs` before release.

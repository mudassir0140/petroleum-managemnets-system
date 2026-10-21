// Offline rules shared by the browser queue, the sync loop and the tests. Pure: no browser or server imports.

// The writes that may be queued while the connection is down. Each one is a create that the server keeps once per
// Idempotency-Key (see with-idempotency.ts). Status changes, deletes, logins, password changes, and anything that
// another party acts on (truck, supplier, driver) stay online-only.
export const QUEUEABLE: { method: string; path: RegExp }[] = [
  { method: "POST", path: /^\/api\/pump-owner\/sales$/ }, // Sales
  { method: "POST", path: /^\/api\/pump-owner\/fuel-orders$/ }, // Fuel orders
  { method: "POST", path: /^\/api\/attendant\/shifts\/(start|end)$/ }, // Shifts
  { method: "POST", path: /^\/api\/attendant\/khata-entries$/ }, // Khata entries
  { method: "POST", path: /^\/api\/khata\/payments$/ }, // Payments
  { method: "POST", path: /^\/api\/khata\/payments\/[a-f0-9]{24}\/proof$/ }, // Proof uploads
  { method: "POST", path: /^\/api\/khata\/client\/payments$/ }, // Payments made by khata clients
  // Employee shift hours: an absolute value, so a replay sets the same thing again.
  { method: "PUT", path: /^\/api\/pumpadmin\/employees\/[a-f0-9]{24}$/ },
];

// A proof image for a payment that is still queued has no payment id yet. Its URL holds this token instead, and the
// outbox fills it in when the payment is saved (see outbox.ts). The placeholder id only checks the path shape.
export const PAYMENT_TOKEN = "__payment__";
const PLACEHOLDER_ID = "0".repeat(24);

export function queuedPathname(url: string): string {
  return new URL(url.split(PAYMENT_TOKEN).join(PLACEHOLDER_ID), "http://local").pathname;
}

export function isQueueable(method: string, pathname: string): boolean {
  const verb = method.toUpperCase();
  return QUEUEABLE.some((rule) => rule.method === verb && rule.path.test(pathname));
}

export type Outcome = "done" | "sign-in" | "retry" | "failed";

// 2xx: saved, or already saved under the same key, so the queued copy is removed.
// 401/403: no matching session, so the change waits until its account signs in again.
// 408, 429 and 5xx (including the 503 "still being saved" answer): the server is busy, so the change is retried.
// Anything else (validation, a closed month): kept for review, never retried blindly.
export function outcomeFor(status: number): Outcome {
  if (status >= 200 && status < 300) return "done";
  if (status === 401 || status === 403) return "sign-in";
  if (status === 408 || status === 429 || status >= 500) return "retry";
  return "failed";
}

// The server keeps an answer for a repeated Idempotency-Key only when it is final: a success, or a refusal the same
// change would get again. A "sign in" or "try again" answer is not kept, so the key runs again later. (Keeping a 401
// would replay it after sign-in and the change would wait forever.)
export function isFinalAnswer(status: number): boolean {
  const outcome = outcomeFor(status);
  return outcome === "done" || outcome === "failed";
}

// 5 s, 10 s, 20 s and so on, up to 5 minutes.
export function retryDelayMs(attempts: number): number {
  return Math.min(5_000 * 2 ** Math.min(attempts, 10), 5 * 60_000);
}

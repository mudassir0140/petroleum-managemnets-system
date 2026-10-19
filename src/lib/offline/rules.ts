// Offline queue rules: which requests may be queued, and what the server's answer means for a queued request.
// Pure, so the browser queue, the sync loop and the tests share one rule.

// The requests that may be queued while offline. Each one already protects against a repeat (see the routes).
// Each entry says why a replay is safe: a unique key on the server (entries, payments, messages), or a write that
// always lands on the same record (sales: one row per day and shift; a notification read mark).
export const QUEUEABLE: { method: string; path: string | RegExp }[] = [
  { method: "POST", path: "/api/attendant/khata-entries" },
  { method: "POST", path: "/api/khata/payments" },
  { method: "POST", path: "/api/pump-owner/sales" },
  { method: "POST", path: "/api/pumpadmin/connect/messages" },
  { method: "POST", path: /^\/api\/(pumpadmin|supplier)\/notifications\/[a-f0-9]{24}\/read$/ },
];

export function isQueueable(method: string, pathname: string): boolean {
  return QUEUEABLE.some((r) => r.method === method.toUpperCase() && (typeof r.path === "string" ? r.path === pathname : r.path.test(pathname)));
}

export type Outcome = "done" | "sign-in" | "retry" | "failed";

// 2xx: saved (or already saved under the same key), so the queued copy is removed.
// 401/403: the session is missing, so the change waits for the next sign-in.
// 408, 429 and 5xx: the server is busy or unreachable, so it is retried later.
// Anything else (validation, a refused duplicate cheque, a closed month): kept for review, never retried blindly.
export function outcomeFor(status: number): Outcome {
  if (status >= 200 && status < 300) return "done";
  if (status === 401 || status === 403) return "sign-in";
  if (status === 408 || status === 429 || status >= 500) return "retry";
  return "failed";
}

// Waits 5 s, then 10 s, 20 s and so on, up to 5 minutes.
export function retryDelayMs(attempts: number): number {
  return Math.min(5_000 * 2 ** Math.min(attempts, 10), 5 * 60_000);
}

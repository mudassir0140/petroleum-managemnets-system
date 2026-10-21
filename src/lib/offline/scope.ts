// The account a queued change belongs to. It is a digest of the session cookies that the queued routes read, so a
// change made by one account is never sent under another account's session (for example after a shared device is
// used by a different pump owner). The digest holds no secret: the session cookies are never sent to the browser.
import { createHash } from "node:crypto";

// Cookies that identify the account on the queued routes (see the routes listed in rules.ts).
export const SCOPE_COOKIES = ["pump_owner_session", "employee_session", "khata_client_session", "admin_session"];

// Returns "" when no session cookie is present, so a signed-out device has its own (empty) scope.
export function scopeFor(cookies: Record<string, string | undefined>): string {
  const parts = SCOPE_COOKIES.filter((name) => cookies[name]).map((name) => `${name}=${cookies[name]}`);
  if (parts.length === 0) return "";
  return createHash("sha256").update(parts.join("&")).digest("hex");
}

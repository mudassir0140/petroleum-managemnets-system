// Tanker driver login username: <driver name>@<pump name>, e.g. alikhan@pso. Pure, so the
// create route, the preview and the login lookup all use one rule.

// Lowercase letters and digits only: spaces, dots, apostrophes and other symbols are dropped.
export function usernamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// The username before any clash suffix. A suffix, if given, goes before the "@" (alikhan2@pso).
// An empty name falls back to "driver" or "pump", never to a truck number or the old format.
export function driverUsername(driverName: string, pumpName: string, suffix = ""): string {
  return `${usernamePart(driverName) || "driver"}${suffix}@${usernamePart(pumpName) || "pump"}`;
}

// The identifier as typed on the login page: lowercase with no spaces, the same as the stored form.
export function normalizeTruckUsername(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

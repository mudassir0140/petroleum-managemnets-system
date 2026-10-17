// Pure: the staff role rule used by the employee login, so it can be tested without the database.

// Saved staff roles that are not role slugs, and the dashboard role each one uses.
export const PUMP_STAFF_ROLE_ALIASES: Record<string, string> = {
  "shift-manager": "pump-manager",
};

// The dashboard role for a saved staff role, or null when the role has no dashboard. Anything else is refused
// rather than sent to the company owner's dashboard.
export function resolveStaffRole(saved: unknown, isKnownSlug: (slug: string) => boolean): string | null {
  if (typeof saved !== "string") return null;
  const key = saved.trim().toLowerCase();
  if (isKnownSlug(key)) return key;
  return PUMP_STAFF_ROLE_ALIASES[key] ?? null;
}

// Lightweight, icon-free view of DASHBOARD_NAV's per-route role
// restrictions — deliberately separate from nav.ts (which pulls in every
// icon component) so this can be imported from edge middleware (proxy.ts)
// without dragging the whole nav module into that bundle.
import { DASHBOARD_NAV } from "./nav";
import type { RoleSlug } from "@/lib/roles";

export interface NavAccessEntry {
  href: string;
  roles?: readonly RoleSlug[];
}

export const NAV_ACCESS: NavAccessEntry[] = DASHBOARD_NAV.map((item) => ({
  href: item.href,
  roles: "roles" in item ? item.roles : undefined,
}));

// Roles allowed for the given /dashboard/* pathname, or:
// - undefined  -> the matched nav item has no role restriction (open to
//   every logged-in company-side role, e.g. the shared Overview page)
// - null       -> no nav item matches this pathname at all (no restriction
//   data to enforce, so access is allowed)
export function resolveAllowedRoles(pathname: string): readonly RoleSlug[] | undefined | null {
  const exact = NAV_ACCESS.find((item) => item.href === pathname);
  if (exact) return exact.roles ?? undefined;

  const candidates = NAV_ACCESS.filter(
    (item) => item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`),
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.href.length - a.href.length);
  return candidates[0].roles ?? undefined;
}

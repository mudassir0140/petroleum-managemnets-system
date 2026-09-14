import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_ROLE_COOKIE_NAME, ROLE_OPTIONS, isDemoRole } from "@/lib/demo/roles";

// Demo Role Login: a single cookie (set by lib/demo/actions.ts, no password
// involved) records which role the visitor picked. Proxy runs on every
// matched request, including prefetches, so it must stay fast and can only
// do this optimistic, cookie-only check — the authoritative check is each
// portal's own DAL (lib/session.ts, lib/attendant/session.ts, etc.), which
// actually redirects mid-render if the role doesn't match.
const PORTALS = ROLE_OPTIONS.map((r) => ({ role: r.value, protectedPrefix: r.dashboardPath, dashboardPath: r.dashboardPath }));

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieRole = request.cookies.get(DEMO_ROLE_COOKIE_NAME)?.value;
  const role = isDemoRole(cookieRole) ? cookieRole : null;

  if (pathname === "/login") {
    const active = role && PORTALS.find((p) => p.role === role);
    if (active) {
      return NextResponse.redirect(new URL(active.dashboardPath, request.url));
    }
    return NextResponse.next();
  }

  for (const portal of PORTALS) {
    if (!pathname.startsWith(portal.protectedPrefix)) continue;

    if (role !== portal.role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pump-owner/:path*", "/attendant/:path*", "/cashier/:path*", "/admin/:path*", "/security-guard/:path*", "/login"],
};

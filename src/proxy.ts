import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_ROLE_COOKIE_NAME, ROLE_OPTIONS, isDemoRole } from "@/lib/demo/roles";

const ADMIN_COOKIE_NAME = "admin_session";
const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";
const PORTALS = ROLE_OPTIONS.map((r) => ({ role: r.value, protectedPrefix: r.dashboardPath, dashboardPath: r.dashboardPath }));

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieRole = request.cookies.get(DEMO_ROLE_COOKIE_NAME)?.value;
  const role = isDemoRole(cookieRole) ? cookieRole : null;
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const pumpOwnerCookie = request.cookies.get(PUMP_OWNER_COOKIE_NAME)?.value;

  // Pump Owner routes: /pump-owner/login is public; /pump-owner/dashboard requires pump_owner_session cookie
  if (pathname.startsWith("/pump-owner")) {
    if (pathname === "/pump-owner/login" || pathname === "/pump-owner") {
      // Public pump owner routes - allow access
      return NextResponse.next();
    }

    // Protected pump owner routes - require pump_owner_session cookie
    if (pathname.startsWith("/pump-owner/dashboard") || pathname.startsWith("/pump-owner/logout")) {
      if (!pumpOwnerCookie && !pathname.startsWith("/pump-owner/logout")) {
        const loginUrl = new URL("/pump-owner/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // Admin routes: /admin/login, /admin/signup are public; /admin/dashboard requires admin_session cookie
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/signup" || pathname === "/admin") {
      // Public admin routes - allow access
      return NextResponse.next();
    }

    // Protected admin routes - require admin_session cookie
    if (pathname.startsWith("/admin/dashboard")) {
      if (!adminCookie) {
        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

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

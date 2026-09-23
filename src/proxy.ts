import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_ROLE_COOKIE_NAME, ROLE_OPTIONS, isDemoRole } from "@/lib/demo/roles";
import { getRoleBySlug, isRoleSlug } from "@/lib/roles";
import { resolveAllowedRoles } from "@/lib/dashboard/nav-access";

const ADMIN_COOKIE_NAME = "admin_session";
const PUMP_OWNER_COOKIE_NAME = "pump_owner_session";
const EMPLOYEE_COOKIE_NAME = "employee_session";
const PORTALS = ROLE_OPTIONS.map((r) => ({ role: r.value, protectedPrefix: r.dashboardPath, dashboardPath: r.dashboardPath }));

// Reads the real (MongoDB-backed) employee session cookie set by
// /api/auth/employee-login and returns its `role` field, or null if the
// cookie is missing/malformed. This is the single source of truth this
// proxy uses to gate /dashboard and /manager — never a client-editable
// value like the legacy demo-role cookie above.
function employeeRoleFromCookie(request: NextRequest): string | null {
  const raw = request.cookies.get(EMPLOYEE_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieRole = request.cookies.get(DEMO_ROLE_COOKIE_NAME)?.value;
  const role = isDemoRole(cookieRole) ? cookieRole : null;
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const pumpOwnerCookie = request.cookies.get(PUMP_OWNER_COOKIE_NAME)?.value;

  // Company-side dashboard tree (/dashboard/*): every real employee role
  // (including Company Owner) lands somewhere under here after
  // /auth/login. An Admin session may browse it too (full access, same as
  // the sidebar's nav filtering). Anyone else — no session, or a role
  // trying to reach a page restricted to other roles — gets sent to the
  // page that's actually theirs, never left on a page scoped to a
  // different role (e.g. an HR account must never render the Company
  // Owner–only sections).
  if (pathname.startsWith("/dashboard")) {
    const isAdmin = !!adminCookie;
    const employeeRole = employeeRoleFromCookie(request);

    if (!isAdmin && !employeeRole) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin && employeeRole && isRoleSlug(employeeRole)) {
      const allowedRoles = resolveAllowedRoles(pathname);
      if (allowedRoles && !allowedRoles.includes(employeeRole)) {
        const ownDashboard = getRoleBySlug(employeeRole).dashboardHref;
        if (ownDashboard !== pathname) {
          return NextResponse.redirect(new URL(ownDashboard, request.url));
        }
      }
    }

    return NextResponse.next();
  }

  // Company Manager's dedicated dashboard tree — same rule: only an
  // authenticated company-manager (or Admin) may render it.
  if (pathname.startsWith("/manager")) {
    const isAdmin = !!adminCookie;
    const employeeRole = employeeRoleFromCookie(request);

    if (!isAdmin && employeeRole !== "company-manager") {
      if (!employeeRole || !isRoleSlug(employeeRole)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      return NextResponse.redirect(new URL(getRoleBySlug(employeeRole).dashboardHref, request.url));
    }

    return NextResponse.next();
  }

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
  matcher: [
    "/pump-owner/:path*",
    "/attendant/:path*",
    "/cashier/:path*",
    "/admin/:path*",
    "/security-guard/:path*",
    "/login",
    "/dashboard/:path*",
    "/manager/:path*",
  ],
};

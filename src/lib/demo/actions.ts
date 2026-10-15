"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth/logout";
import { DEMO_ROLE_COOKIE_NAME, getRoleMeta, isDemoRole } from "@/lib/demo/roles";
import type { DemoLoginState } from "@/lib/demo/auth-state";

// Demo Role Login: no email or password, no account lookup — picking a role
// and clicking Login is the entire flow. The cookie only ever carries which
// role the visitor picked; every dashboard still resolves its own fixed demo
// account server-side (see e.g. lib/session.ts), so a role can never see or
// act on another role's data.
export async function demoLoginAction(_prevState: DemoLoginState | undefined, formData: FormData): Promise<DemoLoginState> {
  const role = formData.get("role");
  if (typeof role !== "string" || !isDemoRole(role)) {
    return { error: "Select a role to continue." };
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_ROLE_COOKIE_NAME, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect(getRoleMeta(role).dashboardPath);
}

export async function demoLogoutAction(): Promise<void> {
  redirect(await endSession());
}

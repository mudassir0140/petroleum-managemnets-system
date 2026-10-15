import { NextRequest } from "next/server";
import { changeOwnPassword, isAccountRole } from "@/lib/account/change-password";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Change Password for the truck, supplier or attendant signed in on this browser.
// The role picks which session cookie is used; the account comes from that session.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isAccountRole(body?.role)) return jsonError(400, "Unknown account type");

    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!currentPassword || !newPassword) return jsonError(400, "Enter the current and the new password");

    const result = await changeOwnPassword(body.role, currentPassword, newPassword);
    if (!result.ok) return jsonError(result.status, result.error);
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("[ChangePassword] error:", error);
    return jsonError(500, "Could not change the password. Try again.");
  }
}

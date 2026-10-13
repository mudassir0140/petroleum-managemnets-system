import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Lets whoever is signed in change their own password. The account is found
// from the session cookie (never from the request body), the current password
// is checked, and only a hash is stored. Any plaintext copy is removed, so the
// Admin and Pump Owner views fall back to "Password changed by user".
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "New password must be different from the current one" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const db = await getDatabase();
    const now = new Date();

    // Admin
    const adminId = parseId(readCookie(cookieStore, "admin_session", "adminId"));
    if (adminId) {
      const admin = await db.collection("admins").findOne({ _id: adminId });
      if (!admin) return notFound();
      if (!admin.passwordHash || !verifyPassword(currentPassword, admin.passwordHash)) return wrongCurrent();
      await db.collection("admins").updateOne(
        { _id: adminId },
        { $set: { passwordHash: hashPassword(newPassword), updatedAt: now } }
      );
      return ok();
    }

    // Pump Owner
    const pumpId = parseId(readCookie(cookieStore, "pump_owner_session", "pumpId"));
    if (pumpId) {
      const pump = await db.collection("pumps").findOne({ _id: pumpId });
      if (!pump) return notFound();
      if (!pump.ownerPasswordHash || !verifyPassword(currentPassword, pump.ownerPasswordHash)) return wrongCurrent();
      await db.collection("pumps").updateOne(
        { _id: pumpId },
        {
          $set: { ownerPasswordHash: hashPassword(newPassword), passwordChangedByUser: true, updatedAt: now },
          $unset: { password: "" },
        }
      );
      return ok();
    }

    // Employee (pump employee or company employee)
    const employeeRaw = readCookieRaw(cookieStore, "employee_session");
    const employeeId = parseId(employeeRaw?.userId);
    if (employeeId) {
      const collectionName = employeeRaw?.isPumpEmployee ? "pump_employees" : "employees";
      const employee = await db.collection(collectionName).findOne({ _id: employeeId });
      if (!employee) return notFound();
      if (!employee.passwordHash || !verifyPassword(currentPassword, employee.passwordHash)) return wrongCurrent();
      await db.collection(collectionName).updateOne(
        { _id: employeeId },
        {
          $set: { passwordHash: hashPassword(newPassword), passwordChangedByUser: true, updatedAt: now },
          $unset: { password: "" },
        }
      );
      return ok();
    }

    // Khata client
    const khataClientId = parseId(readCookie(cookieStore, "khata_client_session", "khataClientId"));
    if (khataClientId) {
      const client = await db.collection("khataClients").findOne({ _id: khataClientId });
      if (!client) return notFound();
      // Accounts created before this change still hold a plaintext password.
      const matches = client.passwordHash
        ? verifyPassword(currentPassword, client.passwordHash)
        : client.password === currentPassword;
      if (!matches) return wrongCurrent();
      await db.collection("khataClients").updateOne(
        { _id: khataClientId },
        {
          $set: { passwordHash: hashPassword(newPassword), passwordChangedByUser: true, updatedAt: now },
          $unset: { password: "" },
        }
      );
      return ok();
    }

    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
  } catch (error) {
    console.error("[ChangePassword] error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function readCookieRaw(store: CookieStore, name: string): any | null {
  const raw = store.get(name)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readCookie(store: CookieStore, name: string, field: string): string | undefined {
  return readCookieRaw(store, name)?.[field];
}

function parseId(value: unknown): ObjectId | null {
  const s = String(value ?? "");
  return /^[a-f0-9]{24}$/i.test(s) ? new ObjectId(s) : null;
}

function ok() {
  return NextResponse.json({ success: true, message: "Password changed successfully" });
}

function wrongCurrent() {
  return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: "Account not found" }, { status: 404 });
}

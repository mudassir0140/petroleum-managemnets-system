import crypto from "crypto";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { encryptSecret } from "@/lib/supplier/secret";
import { ACCOUNT_KINDS, isAccountKind } from "@/lib/account/controls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ kind: string; id: string }>;

// Only the pump owner's session reaches these routes, and every query is limited to that pump.
async function scope(params: Params) {
  const { kind, id } = await params;
  if (!isAccountKind(kind)) return { error: jsonError(404, "Unknown account type") };
  if (!ObjectId.isValid(id)) return { error: jsonError(404, "Account not found") };
  const pumpId = await getOwnerPumpIdForApi();
  if (!pumpId) return { error: jsonError(401, "Unauthorized") };
  const db = await getDatabase();
  return { kind, id: new ObjectId(id), pumpId, collection: db.collection(ACCOUNT_KINDS[kind].collection), db };
}

// Enable or disable an account. A disabled account cannot log in, and its active session is ended.
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const ctx = await scope(params);
    if ("error" in ctx) return ctx.error;

    const body = await request.json().catch(() => null);
    if (typeof body?.disabled !== "boolean") return jsonError(400, "Send disabled as true or false");

    const update: Record<string, unknown> = { disabled: body.disabled, updatedAt: new Date() };
    if (body.disabled && (ctx.kind === "supplier" || ctx.kind === "truck")) update.sessionToken = null;

    const result = await ctx.collection.updateOne({ _id: ctx.id, pumpId: ctx.pumpId }, { $set: update });
    if (result.matchedCount === 0) return jsonError(404, "Account not found");
    return jsonNoStore({ success: true, disabled: body.disabled });
  } catch (error) {
    console.error("[PumpAdmin Accounts] PATCH error:", error);
    return jsonError(500, "Failed to update the account");
  }
}

// Sets a new password for a supplier or a pump employee. Only a hash is stored (suppliers also keep the encrypted copy
// their existing reveal uses). The new password is returned once, in this response, and never again.
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  try {
    const ctx = await scope(params);
    if ("error" in ctx) return ctx.error;
    if (ctx.kind !== "supplier" && ctx.kind !== "employee") return jsonError(400, "This account type resets its password from its own page");

    const password = crypto.randomBytes(9).toString("base64url").slice(0, 12);
    const update: Record<string, unknown> = { passwordHash: hashPassword(password), updatedAt: new Date() };
    if (ctx.kind === "supplier") {
      update.passwordEnc = encryptSecret(password);
      update.sessionToken = null;
    }

    const result = await ctx.collection.updateOne({ _id: ctx.id, pumpId: ctx.pumpId }, { $set: update });
    if (result.matchedCount === 0) return jsonError(404, "Account not found");
    const doc = await ctx.collection.findOne({ _id: ctx.id, pumpId: ctx.pumpId }, { projection: { username: 1 } });
    return jsonNoStore({ username: String(doc?.username ?? ""), password });
  } catch (error) {
    console.error("[PumpAdmin Accounts] reset error:", error);
    return jsonError(500, "Failed to reset the password");
  }
}

// Permanently delete an account record. A khata with payments or entries is kept, so its money history is never lost.
export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const ctx = await scope(params);
    if ("error" in ctx) return ctx.error;

    if (ctx.kind === "khata") {
      const [payments, entries] = await Promise.all([
        ctx.db.collection("khataPayments").countDocuments({ khataClientId: ctx.id, pumpId: ctx.pumpId }, { limit: 1 }),
        ctx.db.collection("khataEntries").countDocuments({ khataClientId: ctx.id, pumpId: ctx.pumpId }, { limit: 1 }),
      ]);
      if (payments > 0 || entries > 0) {
        return jsonError(409, "This khata has payments or fuel entries, so it cannot be deleted. Disable it instead.");
      }
    }
    if (ctx.kind === "truck") {
      const truck = await ctx.collection.findOne({ _id: ctx.id, pumpId: ctx.pumpId }, { projection: { status: 1 } });
      if (truck && truck.status === "in-transit") return jsonError(409, "This tanker is on a trip. Delete it after the trip ends.");
    }

    const result = await ctx.collection.deleteOne({ _id: ctx.id, pumpId: ctx.pumpId });
    if (result.deletedCount === 0) return jsonError(404, "Account not found");
    return jsonNoStore({ success: true });
  } catch (error) {
    console.error("[PumpAdmin Accounts] DELETE error:", error);
    return jsonError(500, "Failed to delete the account");
  }
}

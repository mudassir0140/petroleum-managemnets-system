import { NextRequest } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { getOwnerPumpIdForApi } from "@/lib/supplier/session";
import { jsonError, jsonNoStore } from "@/lib/supplier/http";
import { cleanMessage, pumpChatAllowed, pumpConversationKey, supplierConversationKey, type RequestStatus } from "@/lib/connect/rules";
import { listMessages, requestStatusesBetween, saveMessage } from "@/lib/connect/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Chat = { kind: "pump" | "supplier"; key: string; canSend: boolean; error?: { status: number; message: string } };

// Who this pump may chat with, and whether it may send now. A pump chat needs an accepted request. A supplier chat
// needs no request, but only for a supplier that belongs to this pump and is not disabled.
async function resolveChat(kind: unknown, withId: unknown, pumpId: ObjectId): Promise<Chat | null> {
  if (typeof withId !== "string" || !ObjectId.isValid(withId)) return null;
  const db = await getDatabase();
  const me = String(pumpId);

  if (kind === "pump") {
    if (withId === me) return null;
    const statuses = (await requestStatusesBetween(db, pumpId, new ObjectId(withId))) as RequestStatus[];
    const allowed = pumpChatAllowed(statuses);
    return {
      kind,
      key: pumpConversationKey(me, withId),
      canSend: allowed,
      error: allowed ? undefined : { status: 403, message: "Connect with this pump first. Chat opens after it accepts your request." },
    };
  }
  if (kind === "supplier") {
    const supplier = await db.collection("supplierAccounts").findOne({ _id: new ObjectId(withId), pumpId }, { projection: { disabled: 1 } });
    if (!supplier) return null;
    const disabled = supplier.disabled === true;
    return {
      kind,
      key: supplierConversationKey(withId, me),
      canSend: !disabled,
      error: disabled ? { status: 403, message: "This supplier account is disabled." } : undefined,
    };
  }
  return null;
}

// The saved messages of one pump or one supplier. A pump chat is readable only after it is connected.
export async function GET(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");
    const params = request.nextUrl.searchParams;
    const chat = await resolveChat(params.get("kind"), params.get("with"), pumpId);
    if (!chat) return jsonError(404, "Chat not found");
    if (chat.kind === "pump" && !chat.canSend) return jsonError(403, chat.error?.message ?? "Connect first");

    const db = await getDatabase();
    const docs = await listMessages(db, chat.key);
    const me = String(pumpId);
    return jsonNoStore({
      canSend: chat.canSend,
      notice: chat.error?.message ?? null,
      messages: docs.map((m: Document) => ({
        _id: String(m._id),
        body: String(m.body),
        senderName: String(m.senderName || ""),
        mine: String(m.senderPumpId) === me,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Connect] messages GET error:", error);
    return jsonError(500, "Failed to load messages");
  }
}

// Saves one message. The sender is always the signed-in pump, and the chat rules are checked again on every send.
export async function POST(request: NextRequest) {
  try {
    const pumpId = await getOwnerPumpIdForApi();
    if (!pumpId) return jsonError(401, "Unauthorized");
    const body = await request.json().catch(() => null);
    const chat = await resolveChat(body?.kind, body?.with, pumpId);
    if (!chat) return jsonError(404, "Chat not found");
    if (!chat.canSend) return jsonError(chat.error?.status ?? 403, chat.error?.message ?? "Sending is closed");

    const text = cleanMessage(body?.body);
    if (!text) return jsonError(400, "Write a message of up to 1000 characters");

    const db = await getDatabase();
    const sender = await db.collection("pumps").findOne({ _id: pumpId }, { projection: { name: 1 } });
    const saved = await saveMessage(db, {
      conversationKey: chat.key,
      kind: chat.kind,
      senderPumpId: pumpId,
      senderName: String(sender?.name || "Pump"),
      body: text,
      createdAt: new Date(),
    });
    return jsonNoStore({ _id: String(saved._id), body: text, senderName: String(saved.senderName), mine: true, createdAt: saved.createdAt }, 201);
  } catch (error) {
    console.error("[Connect] messages POST error:", error);
    return jsonError(500, "Failed to send the message");
  }
}

// Connect rules for the pump admin: when a connection can be requested and answered, when chat opens, and what a
// message may contain. Pure, so the routes, the page and the tests use one rule.

export type RequestStatus = "pending" | "accepted" | "rejected";

export const MAX_MESSAGE_LENGTH = 1000;

// A message is trimmed and must have text, up to MAX_MESSAGE_LENGTH characters.
export function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) return null;
  return text;
}

// Both pumps share one conversation. The ids are sorted, so each side builds the same key.
export function pumpConversationKey(a: string, b: string): string {
  return `pump:${[a, b].sort().join(":")}`;
}

// A supplier's chat with one pump. It needs no connection request.
export function supplierConversationKey(supplierId: string, pumpId: string): string {
  return `supplier:${supplierId}:${pumpId}`;
}

// The statuses of the requests between two pumps, in either direction. Returns the reason a new request cannot be sent,
// or null when it can. A rejected request may be sent again.
export function sendBlockReason(sameId: boolean, statuses: RequestStatus[]): string | null {
  if (sameId) return "A pump cannot connect to itself";
  if (statuses.includes("accepted")) return "These pumps are already connected";
  if (statuses.includes("pending")) return "A request is already waiting for an answer";
  return null;
}

// Only the receiving pump can answer, and only while the request is still pending.
export function canAnswer(receiverId: string, sessionPumpId: string, status: string): boolean {
  return receiverId === sessionPumpId && status === "pending";
}

// Chat opens only after the other pump has accepted.
export function pumpChatAllowed(statuses: RequestStatus[]): boolean {
  return statuses.includes("accepted");
}

// What the directory shows for one other pump, from the requests between the two.
export type PumpRelation = "none" | "requested" | "incoming" | "connected";

export function relationFor(iSentPending: boolean, theySentPending: boolean, statuses: RequestStatus[]): PumpRelation {
  if (statuses.includes("accepted")) return "connected";
  if (theySentPending) return "incoming";
  if (iSentPending) return "requested";
  return "none";
}

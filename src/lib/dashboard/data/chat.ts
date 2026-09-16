// @ts-nocheck
import { PUMP_OWNERS } from "@/lib/dashboard/data/pump-owners";

export type ChatSender = "owner" | "pump-owner";

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: ChatSender;
  text: string;
  time: string;
};

export type ChatConversation = {
  id: string;
  pumpId: string;
  pumpOwnerName: string;
  pumpName: string;
  online: boolean;
  lastSeen: string;
};

/**
 * One conversation per pump owner, built from the same PUMP_OWNERS roster
 * used on the Pump Owners & Payments page — no separate owner directory.
 */
export const CHAT_CONVERSATIONS: ChatConversation[] = PUMP_OWNERS.map((account, index) => ({
  id: `chat-${account.pumpId}`,
  pumpId: account.pumpId,
  pumpOwnerName: account.owner,
  pumpName: account.pumpName,
  online: index % 2 === 0,
  lastSeen: index % 2 === 0 ? "Online now" : "Last seen 1 hr ago",
}));

export const CHAT_MESSAGES_SEED: ChatMessage[] = [];

export const CHAT_UNREAD_SEED: Record<string, number> = {
  "chat-PUMP-01": 0,
  "chat-PUMP-03": 2,
  "chat-PUMP-04": 1,
};

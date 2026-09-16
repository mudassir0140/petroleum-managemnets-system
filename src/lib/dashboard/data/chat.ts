// @ts-nocheck
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

export const CHAT_CONVERSATIONS: ChatConversation[] = [];

export const CHAT_MESSAGES_SEED: ChatMessage[] = [];

export const CHAT_UNREAD_SEED: Record<string, number> = {};

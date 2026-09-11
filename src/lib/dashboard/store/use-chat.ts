"use client";

import { CHAT_MESSAGES_SEED, CHAT_UNREAD_SEED, type ChatMessage } from "@/lib/dashboard/data/chat";
import { useSharedState } from "@/lib/store/shared-store";

/**
 * Owner <-> Pump Owner live chat. Uses the same localStorage-backed
 * cross-tab shared store as the rest of the app (see
 * src/lib/store/shared-store.ts), under its own key namespace so it never
 * collides with the Manager's separate "Connect & Chat" feature. A Pump
 * Owner view opened in another tab and posting with sender "pump-owner" to
 * the same conversation id would show up here immediately.
 */
export function useOwnerChatMessages() {
  const [messages, setMessages] = useSharedState<ChatMessage[]>(
    "owner-chat-messages",
    CHAT_MESSAGES_SEED,
  );

  function sendMessage(conversationId: string, text: string) {
    const message: ChatMessage = {
      id: `ochat-${Date.now()}`,
      conversationId,
      sender: "owner",
      text,
      time: "Just now",
    };
    setMessages((prev) => [...prev, message]);
  }

  return { messages, sendMessage };
}

export function useOwnerChatUnread() {
  const [unread, setUnread] = useSharedState<Record<string, number>>(
    "owner-chat-unread",
    CHAT_UNREAD_SEED,
  );

  function markRead(conversationId: string) {
    setUnread((prev) => ({ ...prev, [conversationId]: 0 }));
  }

  return { unread, markRead };
}

"use client";

import { CHAT_CONVERSATIONS_SEED, CHAT_MESSAGES_SEED } from "@/lib/data/chat";
import { useSharedState } from "@/lib/store/shared-store";
import type { ChatMessage } from "@/lib/types";

const UNREAD_SEED: Record<string, number> = {
  "chat-pmp-021": 2,
  "chat-pmp-026": 1,
};

export function useChatMessages() {
  const [messages, setMessages] = useSharedState<ChatMessage[]>(
    "chat-messages",
    CHAT_MESSAGES_SEED,
  );

  function sendMessage(conversationId: string, text: string) {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: "manager",
      text,
      time: "Just now",
    };
    setMessages((prev) => [...prev, message]);
  }

  return { messages, sendMessage };
}

export function useChatUnread() {
  const [unread, setUnread] = useSharedState<Record<string, number>>(
    "chat-unread",
    UNREAD_SEED,
  );

  function markRead(conversationId: string) {
    setUnread((prev) => ({ ...prev, [conversationId]: 0 }));
  }

  return { unread, markRead };
}

export const CHAT_CONVERSATIONS = CHAT_CONVERSATIONS_SEED;

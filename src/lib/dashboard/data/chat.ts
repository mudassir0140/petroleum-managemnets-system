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

export const CHAT_MESSAGES_SEED: ChatMessage[] = [
  { id: "ochat-1", conversationId: "chat-PUMP-01", sender: "pump-owner", text: "Good morning! Can you confirm this week's petrol allocation?", time: "08:05 AM" },
  { id: "ochat-2", conversationId: "chat-PUMP-01", sender: "owner", text: "Morning Ahmed, yes — 12,000L confirmed for this week, same as last.", time: "08:12 AM" },
  { id: "ochat-3", conversationId: "chat-PUMP-01", sender: "pump-owner", text: "Perfect, thank you.", time: "08:13 AM" },

  { id: "ochat-4", conversationId: "chat-PUMP-02", sender: "owner", text: "Imran, your remaining due of Rs 320,000 is due on the 18th, please plan accordingly.", time: "Yesterday, 05:40 PM" },
  { id: "ochat-5", conversationId: "chat-PUMP-02", sender: "pump-owner", text: "Noted, will clear it by the 17th.", time: "Yesterday, 05:52 PM" },

  { id: "ochat-6", conversationId: "chat-PUMP-03", sender: "pump-owner", text: "We're overdue on payment, I know — can we get a 5 day extension?", time: "07:20 AM" },
  { id: "ochat-7", conversationId: "chat-PUMP-03", sender: "owner", text: "I can approve a 3 day extension, please clear it by the 8th.", time: "07:35 AM" },
  { id: "ochat-8", conversationId: "chat-PUMP-03", sender: "pump-owner", text: "That works, thank you for understanding.", time: "07:36 AM" },

  { id: "ochat-9", conversationId: "chat-PUMP-04", sender: "owner", text: "Waqar, following up on the overdue balance — any update?", time: "2 days ago" },

  { id: "ochat-10", conversationId: "chat-PUMP-05", sender: "pump-owner", text: "Requesting an extra tanker this week, demand is up.", time: "09:02 AM" },
  { id: "ochat-11", conversationId: "chat-PUMP-05", sender: "owner", text: "I'll get an additional tanker scheduled for Thursday.", time: "09:15 AM" },

  { id: "ochat-12", conversationId: "chat-PUMP-06", sender: "pump-owner", text: "Payment sent via bank transfer, please confirm receipt.", time: "Yesterday, 11:10 AM" },
  { id: "ochat-13", conversationId: "chat-PUMP-06", sender: "owner", text: "Received and confirmed, thank you Bilal.", time: "Yesterday, 11:30 AM" },
];

export const CHAT_UNREAD_SEED: Record<string, number> = {
  "chat-PUMP-01": 0,
  "chat-PUMP-03": 2,
  "chat-PUMP-04": 1,
};

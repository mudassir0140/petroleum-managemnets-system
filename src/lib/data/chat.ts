import type { ChatConversation, ChatMessage } from "@/lib/types";

export const CHAT_CONVERSATIONS_SEED: ChatConversation[] = [
  { id: "chat-pmp-021", pumpOwnerName: "Suresh Yadav", pumpId: "pmp-021", pumpName: "Highway 44 Service Station", online: true, lastSeen: "Online now" },
  { id: "chat-pmp-033", pumpOwnerName: "Vikram Singh", pumpId: "pmp-033", pumpName: "Riverside Fuel Station", online: false, lastSeen: "Last seen 25 min ago" },
  { id: "chat-pmp-026", pumpOwnerName: "Priya Nair", pumpId: "pmp-026", pumpName: "Industrial Area Station", online: true, lastSeen: "Online now" },
  { id: "chat-pmp-007", pumpOwnerName: "Anita Sharma", pumpId: "pmp-007", pumpName: "Central Market Pump", online: false, lastSeen: "Last seen 2 hr ago" },
  { id: "chat-pmp-014", pumpOwnerName: "Ramesh Gupta", pumpId: "pmp-014", pumpName: "Ashoka Road Fuel Point", online: false, lastSeen: "Last seen yesterday" },
  { id: "chat-pmp-019", pumpOwnerName: "Farhan Ali", pumpId: "pmp-019", pumpName: "North Bypass Pump", online: true, lastSeen: "Online now" },
  { id: "chat-pmp-011", pumpOwnerName: "Karan Mehta", pumpId: "pmp-011", pumpName: "Airport Road Pump", online: false, lastSeen: "Last seen 4 hr ago" },
  { id: "chat-pmp-041", pumpOwnerName: "Deepak Joshi", pumpId: "pmp-041", pumpName: "Old Town Fuel Point", online: false, lastSeen: "Last seen 1 day ago" },
];

export const CHAT_MESSAGES_SEED: ChatMessage[] = [
  { id: "msg-1", conversationId: "chat-pmp-021", sender: "owner", text: "Diesel tank is almost empty, when is the tanker arriving?", time: "07:32 AM" },
  { id: "msg-2", conversationId: "chat-pmp-021", sender: "manager", text: "Tanker UP32 GT 1101 left the depot at 5:30 AM, it's held up at the highway checkpoint.", time: "07:40 AM" },
  { id: "msg-3", conversationId: "chat-pmp-021", sender: "manager", text: "Revised ETA is around 9:45 AM, I'm tracking it closely.", time: "07:41 AM" },
  { id: "msg-4", conversationId: "chat-pmp-021", sender: "owner", text: "Please prioritise us, we're turning away customers.", time: "07:55 AM" },
  { id: "msg-5", conversationId: "chat-pmp-021", sender: "manager", text: "Understood, I've flagged it as high priority and I'll update you every 30 minutes.", time: "07:57 AM" },

  { id: "msg-6", conversationId: "chat-pmp-033", sender: "manager", text: "Hi Vikram ji, following up on the invoice discrepancy you raised for 6 Sep delivery.", time: "Yesterday, 04:10 PM" },
  { id: "msg-7", conversationId: "chat-pmp-033", sender: "owner", text: "Yes, our dip reading shows 9,800L received, not 10,200L as invoiced.", time: "Yesterday, 04:20 PM" },
  { id: "msg-8", conversationId: "chat-pmp-033", sender: "manager", text: "I've asked our field officer to verify with the tanker log. Will confirm by tomorrow.", time: "Yesterday, 04:25 PM" },

  { id: "msg-9", conversationId: "chat-pmp-026", sender: "owner", text: "Petrol stock is down to 12%, please schedule a delivery today.", time: "06:50 AM" },
  { id: "msg-10", conversationId: "chat-pmp-026", sender: "manager", text: "Noted, tanker TK-02 is already en route with 8000L petrol, ETA 9:30 AM.", time: "06:58 AM" },
  { id: "msg-11", conversationId: "chat-pmp-026", sender: "owner", text: "Great, thank you for the quick response.", time: "07:00 AM" },

  { id: "msg-12", conversationId: "chat-pmp-007", sender: "owner", text: "Can we get an increased weekly allocation for premium fuel? Demand is growing.", time: "Yesterday, 06:15 PM" },
  { id: "msg-13", conversationId: "chat-pmp-007", sender: "manager", text: "I'll review last month's sales trend and get back to you with a revised allocation plan.", time: "Yesterday, 06:30 PM" },

  { id: "msg-14", conversationId: "chat-pmp-014", sender: "manager", text: "Delivery of 7500L diesel confirmed received at 8:32 AM, thanks for confirming on your end.", time: "Today, 08:35 AM" },
  { id: "msg-15", conversationId: "chat-pmp-014", sender: "owner", text: "Confirmed, all good on our side.", time: "Today, 08:40 AM" },

  { id: "msg-16", conversationId: "chat-pmp-019", sender: "owner", text: "Any update on this afternoon's delivery slot?", time: "08:10 AM" },
  { id: "msg-17", conversationId: "chat-pmp-019", sender: "manager", text: "Yes, tanker TK-01 is scheduled to depart at 1:30 PM, expected arrival 4:00 PM.", time: "08:15 AM" },

  { id: "msg-18", conversationId: "chat-pmp-011", sender: "manager", text: "Canopy lighting has been fixed, please confirm it's working fine at night.", time: "03 Sep 2026" },
  { id: "msg-19", conversationId: "chat-pmp-011", sender: "owner", text: "Confirmed, both lights are working now. Thanks!", time: "03 Sep 2026" },

  { id: "msg-20", conversationId: "chat-pmp-041", sender: "owner", text: "Payment for last month has been cleared via NEFT, please confirm receipt.", time: "01 Sep 2026" },
  { id: "msg-21", conversationId: "chat-pmp-041", sender: "manager", text: "Received and confirmed, thank you!", time: "01 Sep 2026" },
];

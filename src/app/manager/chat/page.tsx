"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, MapPinIcon, SendIcon } from "@/components/icons";
import { pumpById } from "@/lib/data/pumps";
import { CHAT_CONVERSATIONS, useChatMessages, useChatUnread } from "@/lib/store/use-chat";

export default function ConnectChatPage() {
  const { messages, sendMessage } = useChatMessages();
  const { unread, markRead } = useChatUnread();
  const [activeId, setActiveId] = useState(CHAT_CONVERSATIONS[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const active = CHAT_CONVERSATIONS.find((c) => c.id === activeId) ?? null;
  const threadMessages = useMemo(
    () => messages.filter((m) => m.conversationId === activeId),
    [messages, activeId],
  );

  function selectConversation(id: string) {
    setActiveId(id);
    markRead(id);
    setMobileShowThread(true);
  }

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || !activeId) return;
    sendMessage(activeId, draft.trim());
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Conversation list */}
      <div
        className={`w-full shrink-0 flex-col border-r border-slate-100 sm:flex sm:w-80 dark:border-slate-800 ${
          mobileShowThread ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Pump Owners</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {CHAT_CONVERSATIONS.filter((c) => c.online).length} online now
          </p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {CHAT_CONVERSATIONS.map((conversation) => {
            const pump = pumpById(conversation.pumpId);
            const unreadCount = unread[conversation.id] ?? 0;
            const lastMessage = [...messages]
              .reverse()
              .find((m) => m.conversationId === conversation.id);
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60 ${
                    activeId === conversation.id ? "bg-amber-50/60 dark:bg-amber-500/5" : ""
                  }`}
                >
                  <span className="relative shrink-0">
                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white dark:from-slate-600 dark:to-slate-800">
                      {conversation.pumpOwnerName
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </span>
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        conversation.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {conversation.pumpOwnerName}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {pump?.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {lastMessage?.text ?? "No messages yet"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Thread */}
      <div className={`flex min-w-0 flex-1 flex-col ${mobileShowThread ? "flex" : "hidden sm:flex"}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMobileShowThread(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 sm:hidden dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {active.pumpOwnerName}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  <MapPinIcon className="size-3 shrink-0" />
                  {active.pumpName} ·{" "}
                  <span className={active.online ? "text-emerald-600 dark:text-emerald-400" : ""}>
                    {active.lastSeen}
                  </span>
                </p>
              </div>
              <a
                href={`tel:${pumpById(active.pumpId)?.ownerPhone.replace(/\s+/g, "")}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Call
              </a>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {threadMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "manager" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      message.sender === "manager"
                        ? "rounded-br-sm bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                        : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.sender === "manager"
                          ? "text-white/70 dark:text-slate-950/60"
                          : "text-slate-400"
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
              {threadMessages.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">
                  No messages yet. Say hello 👋
                </p>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${active.pumpOwnerName}...`}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                <SendIcon className="size-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

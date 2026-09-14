"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge, OnlineDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { IconArrowLeft, IconBuilding, IconCheck, IconChat, IconSend, IconX } from "@/components/icons";
import { formatTime } from "@/lib/format";
import { nowMs } from "@/lib/utils";
import type { ChatMessage, ConnectionStatus, DirectoryOwner } from "@/lib/types";

const COMPANY_ID = "company-manager";
const COMPANY_NAME = "Company Manager";
const SEED_MESSAGE_AT = new Date(nowMs() - 3600_000).toISOString();

type Tab = "chats" | "requests" | "find";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

const AUTO_REPLIES = [
  "Got it, thanks for the update!",
  "Noted — I'll check and get back to you shortly.",
  "Sounds good. Let's stay in touch.",
  "Thanks for reaching out.",
];

const COMPANY_REPLIES = [
  "Thanks for the message — the concerned department will review this.",
  "Received. We'll follow up on this shortly.",
  "Noted, thank you for flagging this to us.",
];

export function ConnectHub({ initialDirectory, ownerId, ownerName }: { initialDirectory: DirectoryOwner[]; ownerId: string; ownerName: string }) {
  const [statusOverrides, setStatusOverrides] = useLocalStorageState<Record<string, ConnectionStatus>>(
    `ppms:connect:status:${ownerId}`,
    {},
  );
  const [messages, setMessages] = useLocalStorageState<Record<string, ChatMessage[]>>(`ppms:connect:messages:${ownerId}`, {
    [COMPANY_ID]: [
      {
        id: "seed-company-1",
        conversationId: COMPANY_ID,
        senderId: COMPANY_ID,
        senderName: COMPANY_NAME,
        text: "Welcome! Reach out here anytime you have questions about pricing, deliveries or settlements.",
        sentAt: SEED_MESSAGE_AT,
      },
    ],
  });

  const directory: DirectoryOwner[] = useMemo(
    () => initialDirectory.map((d) => ({ ...d, connectionStatus: statusOverrides[d.ownerId] ?? d.connectionStatus })),
    [initialDirectory, statusOverrides],
  );

  const [tab, setTab] = useState<Tab>("chats");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const connected = directory.filter((d) => d.connectionStatus === "connected");
  const received = directory.filter((d) => d.connectionStatus === "pending_received");
  const sent = directory.filter((d) => d.connectionStatus === "pending_sent");
  const findResults = directory.filter((d) => {
    const q = query.trim().toLowerCase();
    return !q || d.ownerName.toLowerCase().includes(q) || d.pumpName.toLowerCase().includes(q) || d.city.toLowerCase().includes(q);
  });

  const activeOwner = activeId ? directory.find((d) => d.ownerId === activeId) : null;
  const activeName = activeId === COMPANY_ID ? COMPANY_NAME : activeOwner?.ownerName;
  const activeMessages = activeId ? messages[activeId] ?? [] : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, activeId]);

  function setStatus(id: string, status: ConnectionStatus) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
  }

  function openConversation(id: string) {
    setActiveId(id);
    setMobileView("thread");
  }

  function sendMessage() {
    if (!draft.trim() || !activeId) return;
    const outgoing: ChatMessage = {
      id: `${nowMs()}`,
      conversationId: activeId,
      senderId: ownerId,
      senderName: ownerName,
      text: draft.trim(),
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), outgoing] }));
    setDraft("");

    const replyPool = activeId === COMPANY_ID ? COMPANY_REPLIES : AUTO_REPLIES;
    const replyName = activeId === COMPANY_ID ? COMPANY_NAME : activeName ?? "Contact";
    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: `${Date.now()}-r`,
        conversationId: activeId,
        senderId: activeId,
        senderName: replyName,
        text: replyPool[Math.floor(Math.random() * replyPool.length)],
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), reply] }));
    }, 1400);
  }

  function lastMessagePreview(id: string) {
    const list = messages[id];
    if (!list || list.length === 0) return "No messages yet — say hello!";
    return list[list.length - 1].text;
  }

  return (
    <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 lg:grid-cols-[320px_1fr]" style={{ height: "min(720px, 78vh)" }}>
      <div className={`flex-col border-border-subtle lg:flex lg:border-r ${mobileView === "list" ? "flex" : "hidden"}`}>
        <div className="border-b border-border-subtle p-3">
          <div className="mb-3 flex gap-1 rounded-lg bg-surface-3 p-1">
            {(["chats", "requests", "find"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  tab === t ? "bg-surface-1 text-ink-primary shadow-sm" : "text-ink-secondary"
                }`}
              >
                {t === "chats" ? "Chats" : t === "requests" ? `Requests${received.length ? ` (${received.length})` : ""}` : "Find Owners"}
              </button>
            ))}
          </div>
          {tab === "find" && <SearchInput value={query} onChange={setQuery} placeholder="Search by name, pump or city…" />}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {tab === "chats" && (
            <div className="space-y-1">
              <button
                onClick={() => openConversation(COMPANY_ID)}
                className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-2 ${activeId === COMPANY_ID ? "bg-surface-2" : ""}`}
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                  <IconBuilding size={18} />
                  <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot online /></span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-primary">{COMPANY_NAME}</span>
                    <Badge tone="brand" dot={false}>Official</Badge>
                  </span>
                  <span className="block truncate text-xs text-ink-muted">{lastMessagePreview(COMPANY_ID)}</span>
                </span>
              </button>

              {connected.length === 0 ? (
                <p className="px-2.5 py-6 text-center text-xs text-ink-muted">Connect with other pump owners to start chatting.</p>
              ) : (
                connected.map((owner) => (
                  <button
                    key={owner.ownerId}
                    onClick={() => openConversation(owner.ownerId)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-2 ${activeId === owner.ownerId ? "bg-surface-2" : ""}`}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: owner.avatarColor }}>
                      {initials(owner.ownerName)}
                      <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot online={owner.online} /></span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-primary">{owner.ownerName}</span>
                      <span className="block truncate text-xs text-ink-muted">{lastMessagePreview(owner.ownerId)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="space-y-4 p-1">
              <div>
                <p className="mb-2 px-1 text-xs font-medium text-ink-muted">Received</p>
                {received.length === 0 ? (
                  <p className="px-1 text-xs text-ink-muted">No incoming requests.</p>
                ) : (
                  <div className="space-y-2">
                    {received.map((owner) => (
                      <div key={owner.ownerId} className="rounded-xl border border-border-subtle p-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: owner.avatarColor }}>
                            {initials(owner.ownerName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink-primary">{owner.ownerName}</p>
                            <p className="truncate text-xs text-ink-muted">{owner.pumpName} · {owner.city}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="primary" size="sm" icon={<IconCheck size={13} />} className="flex-1" onClick={() => setStatus(owner.ownerId, "connected")}>
                            Accept
                          </Button>
                          <Button variant="ghost" size="sm" icon={<IconX size={13} />} className="flex-1" onClick={() => setStatus(owner.ownerId, "none")}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 px-1 text-xs font-medium text-ink-muted">Sent</p>
                {sent.length === 0 ? (
                  <p className="px-1 text-xs text-ink-muted">No pending sent requests.</p>
                ) : (
                  <div className="space-y-2">
                    {sent.map((owner) => (
                      <div key={owner.ownerId} className="flex items-center gap-2.5 rounded-xl border border-border-subtle p-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: owner.avatarColor }}>
                          {initials(owner.ownerName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-primary">{owner.ownerName}</p>
                          <p className="truncate text-xs text-ink-muted">Awaiting response</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStatus(owner.ownerId, "none")}>
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "find" && (
            <div className="space-y-2 p-1">
              {findResults.length === 0 ? (
                <EmptyState title="No pump owners found" description="Try a different name or city." />
              ) : (
                findResults.map((owner) => (
                  <div key={owner.ownerId} className="flex items-center gap-2.5 rounded-xl border border-border-subtle p-2.5">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: owner.avatarColor }}>
                      {initials(owner.ownerName)}
                      <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot online={owner.online} /></span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-primary">{owner.ownerName}</p>
                      <p className="truncate text-xs text-ink-muted">{owner.pumpName} · {owner.city}</p>
                    </div>
                    {owner.connectionStatus === "connected" ? (
                      <Badge tone="good">Connected</Badge>
                    ) : owner.connectionStatus === "pending_sent" ? (
                      <Badge tone="neutral">Requested</Badge>
                    ) : owner.connectionStatus === "pending_received" ? (
                      <Button variant="primary" size="sm" onClick={() => setTab("requests")}>
                        Respond
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setStatus(owner.ownerId, "pending_sent")}>
                        Connect
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex-col lg:flex ${mobileView === "thread" ? "flex" : "hidden"}`}>
        {!activeId ? (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState icon={<IconChat size={22} />} title="Select a conversation" description="Pick a chat from the list, or find a pump owner to connect with." />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border-subtle p-3">
              <button onClick={() => setMobileView("list")} className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-3 lg:hidden">
                <IconArrowLeft size={18} />
              </button>
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: activeId === COMPANY_ID ? "var(--brand-500)" : activeOwner?.avatarColor }}>
                {activeId === COMPANY_ID ? <IconBuilding size={16} /> : initials(activeName ?? "")}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-primary">{activeName}</p>
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <OnlineDot online={activeId === COMPANY_ID ? true : !!activeOwner?.online} />
                  {activeId === COMPANY_ID ? "Online" : activeOwner?.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {activeMessages.length === 0 ? (
                <p className="py-10 text-center text-xs text-ink-muted">No messages yet — say hello!</p>
              ) : (
                activeMessages.map((m) => {
                  const mine = m.senderId === ownerId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand-500 text-white" : "bg-surface-3 text-ink-primary"}`}>
                        <p>{m.text}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink-muted"}`}>{formatTime(m.sentAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2 border-t border-border-subtle p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <Button type="submit" variant="primary" size="md" icon={<IconSend size={15} />} disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

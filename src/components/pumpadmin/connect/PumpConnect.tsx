"use client";

// Connect & Chat for the pump admin. Pumps connect by request and chat only after the request is accepted. Suppliers
// can be chatted with directly. Every request and message is saved in the database, so it survives a refresh.
import { offlineFetch } from "@/lib/offline/outbox";
import { useRef, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { formatDateTime } from "@/lib/format";

type Relation = "none" | "requested" | "incoming" | "connected";

interface PumpRow {
  _id: string;
  name: string;
  companyName?: string;
  city: string;
  relation: Relation;
}
interface Incoming {
  _id: string;
  pumpId: string;
  name: string;
  createdAt: string;
}
interface SupplierRow {
  _id: string;
  name: string;
  username: string;
  disabled: boolean;
}
interface Sent {
  _id: string;
  pumpId: string;
  name: string;
  status: string;
  createdAt: string;
}
interface Suggestion {
  _id: string;
  name: string;
  companyName: string;
  city: string;
  relation: Relation;
}
interface Overview {
  sent: Sent[];
  received: Sent[];
  pumps: PumpRow[];
  incoming: Incoming[];
  connected: { _id: string; name: string }[];
  suppliers: SupplierRow[];
}
interface Message {
  _id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
}
interface Selected {
  kind: "pump" | "supplier";
  id: string;
  name: string;
}

const RELATION_LABEL: Record<Relation, string> = {
  none: "Not connected",
  requested: "Request sent",
  incoming: "Wants to connect",
  connected: "Connected",
};

const RELATION_STYLE: Record<Relation, string> = {
  none: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  requested: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  incoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  connected: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABEL: Record<string, string> = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const button = "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";
const primary = `${button} bg-amber-500 text-white hover:bg-amber-600`;
const ghost = `${button} border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200`;

export function PumpConnect() {
  const [overview, setOverview] = useState<Overview>({ pumps: [], incoming: [], connected: [], suppliers: [], sent: [], received: [] });
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [canSend, setCanSend] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Suggestions come from the database. Typing waits a moment, so each keystroke does not send a request.
  async function runSearch(text: string) {
    try {
      const response = await fetch(`/api/pumpadmin/connect/search?q=${encodeURIComponent(text)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    }
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const text = value.trim();
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(() => void runSearch(text), 250);
  }

  async function loadOverview() {
    try {
      const response = await fetch("/api/pumpadmin/connect", { cache: "no-store" });
      if (response.ok) setOverview(await response.json());
    } catch {
      // The last list stays on screen until the next refresh.
    }
  }

  async function loadMessages() {
    if (!selected) return;
    try {
      const params = new URLSearchParams({ kind: selected.kind, with: selected.id });
      const response = await fetch(`/api/pumpadmin/connect/messages?${params}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessages([]);
        setCanSend(false);
        setNotice(data.error || "Could not load this chat.");
        return;
      }
      setMessages(data.messages ?? []);
      setCanSend(Boolean(data.canSend));
      setNotice(data.notice ?? null);
    } catch {
      setNotice("Network error. The chat will refresh shortly.");
    }
  }

  useLivePoll(loadOverview, 4000);
  useLivePoll(loadMessages, 3000, [selected?.kind, selected?.id], Boolean(selected));

  // Sends a pump-to-pump request, or answers one, through the request flow that already existed.
  async function requestAction(body: Record<string, string>, failMessage: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/pumpadmin/pump-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || failMessage);
        return;
      }
      await loadOverview();
      if (query.trim().length >= 2) void runSearch(query.trim());
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function openChat(kind: Selected["kind"], id: string, name: string) {
    setDraft("");
    setError("");
    setSelected({ kind, id, name });
    setMessages([]);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !canSend) return;
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    try {
      setInfo("");
      const response = await offlineFetch("/api/pumpadmin/connect/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: selected.kind, with: selected.id, body: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.queued) {
        setDraft("");
        setInfo("Saved on this device. It will be sent when the internet returns. / انٹرنیٹ آنے پر بھیج دی جائے گی");
        return;
      }
      if (!response.ok) {
        setError(data.error || "The message was not sent.");
        return;
      }
      setDraft("");
      setMessages((list) => [...list, data]);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 0);
    } catch {
      setError("Network error. The message was not sent.");
    } finally {
      setBusy(false);
    }
  }



  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Find a pump / پمپ تلاش کریں" subtitle="Search by pump name or company name" />
          <div className="px-5 pb-5">
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Pump name or company name / پمپ یا کمپنی کا نام"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {query.trim().length >= 2 && (
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
                {suggestions.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">No matching pumps / کوئی پمپ نہیں ملا</li>
                ) : (
                  suggestions.map((s) => (
                    <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="truncate text-xs text-slate-500">{[s.companyName, s.city].filter(Boolean).join(" · ")}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${RELATION_STYLE[s.relation]}`}>{RELATION_LABEL[s.relation]}</span>
                      </div>
                      {s.relation === "none" && (
                        <button type="button" disabled={busy} className={primary} onClick={() => requestAction({ action: "send", receiverId: s._id }, "Could not send the request.")}>
                          Send Request
                        </button>
                      )}
                      {s.relation === "incoming" && <span className="text-xs text-slate-500">Answer it under Received Requests</span>}
                      {s.relation === "connected" && (
                        <button type="button" className={ghost} onClick={() => openChat("pump", s._id, s.name)}>
                          Chat
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Received Requests / موصول شدہ درخواستیں" subtitle={`${overview.incoming.length} waiting for your answer`} />
          {overview.received.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">No requests received yet. / ابھی کوئی درخواست موصول نہیں ہوئی</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {overview.received.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                  </div>
                  {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} className={primary} onClick={() => requestAction({ action: "respond", requestId: r._id, status: "accepted" }, "Could not accept.")}>
                      Accept
                    </button>
                    <button type="button" disabled={busy} className={ghost} onClick={() => requestAction({ action: "respond", requestId: r._id, status: "rejected" }, "Could not reject.")}>
                      Reject
                    </button>
                  </div>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status] ?? ""}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Sent Requests / بھیجی گئی درخواستیں" subtitle={`${overview.sent.length} sent`} />
          {overview.sent.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">No requests sent yet. / ابھی کوئی درخواست نہیں بھیجی</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {overview.sent.map((r) => (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status] ?? ""}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pumps / پمپ" subtitle="Send a request. Chat opens when the other pump accepts." />
          {overview.pumps.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">No other pumps yet. / ابھی کوئی اور پمپ نہیں</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {overview.pumps.map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${RELATION_STYLE[p.relation]}`}>{RELATION_LABEL[p.relation]}</span>
                      {p.companyName && <span className="text-xs text-slate-500">{p.companyName}</span>}
                      {p.city && <span className="text-xs text-slate-500">{p.city}</span>}
                    </div>
                  </div>
                  {p.relation === "none" && (
                    <button type="button" disabled={busy} className={primary} onClick={() => requestAction({ action: "send", receiverId: p._id }, "Could not send the request.")}>
                      Send request
                    </button>
                  )}
                  {p.relation === "connected" && (
                    <button type="button" className={ghost} onClick={() => openChat("pump", p._id, p.name)}>
                      Chat
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Suppliers / سپلائر" subtitle="Chat directly. No connection request is needed." />
          {overview.suppliers.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">No suppliers yet. / ابھی کوئی سپلائر نہیں</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {overview.suppliers.map((s) => (
                <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                    <p className="truncate font-mono text-xs text-slate-500">{s.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.disabled && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">Disabled</span>}
                    <button type="button" className={ghost} onClick={() => openChat("supplier", s._id, s.name)}>
                      Chat
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex min-h-[28rem] flex-col">
        {!selected ? (
          <EmptyState title="Choose a chat" description="Pick a connected pump or a supplier to start chatting. / چیٹ کے لیے پمپ یا سپلائر چنیں" />
        ) : (
          <>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{selected.name}</p>
              <p className="text-xs text-slate-500">{selected.kind === "pump" ? "Pump chat" : "Supplier chat"}</p>
            </div>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {notice && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{notice}</p>}
              {messages.length === 0 && !notice && <p className="text-sm text-slate-500">No messages yet. / ابھی کوئی پیغام نہیں</p>}
              {messages.map((m) => (
                <div key={m._id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"}`}>
                    {!m.mine && <p className="text-[11px] font-semibold opacity-70">{m.senderName}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">{formatDateTime(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="border-t border-slate-200 p-4 dark:border-slate-700">
              {info && <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">{info}</p>}
              {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!canSend}
                  maxLength={1000}
                  rows={2}
                  placeholder={canSend ? "Write a message / پیغام لکھیں" : "Chat is closed"}
                  className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                />
                <button type="submit" disabled={!canSend || busy || !draft.trim()} className={primary}>
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { CopyIcon, EyeIcon, EyeOffIcon, PlusIcon, SendIcon } from "@/components/icons";
import {
  SUPPLIER_FUEL_LABELS,
  SUPPLIER_FUEL_TYPES,
  SUPPLIER_STATUS_LABELS,
  type SupplierFuelType,
  type SupplierRequestStatus,
  type SupplierRequestView,
  type SupplierView,
} from "@/lib/supplier/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const STATUS_STYLE: Record<SupplierRequestStatus, string> = {
  sent: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "on-the-way": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatAdvance(value: number): string {
  return `PKR ${(Number.isFinite(value) ? value : 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

// The supplier page: Request Fuel at the top, then details, credentials and the live request history.
export function SupplierDetail({ supplier, initialRequests }: { supplier: SupplierView; initialRequests: SupplierRequestView[] }) {
  const [requests, setRequests] = useState<SupplierRequestView[]>(initialRequests);
  const [showRequest, setShowRequest] = useState(false);

  // Live status: the history is refreshed in the background every 10 seconds.
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/pumpadmin/suppliers/${supplier.id}/requests`, { cache: "no-store", credentials: "include" });
        if (!response.ok || !active) return;
        const data = await response.json();
        if (active && Array.isArray(data)) setRequests(data);
      } catch {
        // Keep the last history if a refresh fails.
      }
    }
    const timer = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [supplier.id]);

  async function refreshNow() {
    try {
      const response = await fetch(`/api/pumpadmin/suppliers/${supplier.id}/requests`, { cache: "no-store", credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setRequests(data);
      }
    } catch {
      // Keep the last history.
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => setShowRequest((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <PlusIcon size={16} />
          Request Fuel / ایندھن منگوائیں
        </button>
      </div>

      {showRequest && (
        <RequestFuelPanel
          supplierId={supplier.id}
          onSent={() => {
            setShowRequest(false);
            refreshNow();
          }}
        />
      )}

      <Card>
        <CardHeader title="Supplier details / سپلائر کی تفصیل" />
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Name / نام</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{supplier.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Company Name / کمپنی کا نام</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{supplier.companyName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Advance / ایڈوانس</dt>
            <dd className="font-medium text-amber-700 dark:text-amber-400">{formatAdvance(supplier.advance)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Created / بنایا گیا</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{formatDate(supplier.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <CredentialsCard supplierId={supplier.id} username={supplier.username} />

      <Card>
        <CardHeader title="Request history / درخواستوں کی تاریخ" subtitle="Updates every 10 seconds / ہر 10 سیکنڈ بعد تازہ ہوتی ہے" />
        {requests.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No requests yet / ابھی کوئی درخواست نہیں</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {SUPPLIER_FUEL_LABELS[r.fuelType]?.en ?? "—"} / {SUPPLIER_FUEL_LABELS[r.fuelType]?.ur ?? "—"} · {(r.litres ?? 0).toLocaleString()} L
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {r.pumpName || "—"} · Sent / بھیجا {formatDate(r.sentAt)}
                  </p>
                  {r.note && <p className="text-xs text-slate-500">{r.note}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.sent}`}>
                  {SUPPLIER_STATUS_LABELS[r.status]?.en ?? r.status} / {SUPPLIER_STATUS_LABELS[r.status]?.ur ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RequestFuelPanel({ supplierId, onSent }: { supplierId: string; onSent: () => void }) {
  const [fuelType, setFuelType] = useState<SupplierFuelType | "">("");
  const [litres, setLitres] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fuelType) return setError("Choose a fuel type / ایندھن کی قسم چنیں");
    const quantity = Number(litres);
    if (!quantity || quantity <= 0) return setError("Enter the litres / لیٹر لکھیں");

    setSending(true);
    try {
      const response = await fetch("/api/pumpadmin/supplier-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ supplierId, fuelType, litres: quantity, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to send the request");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Request Fuel / ایندھن منگوائیں" subtitle="The request is saved as Sent / درخواست بھیجی گئی کے طور پر محفوظ ہوگی" />
      <form onSubmit={handleSend} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel / ایندھن</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPLIER_FUEL_TYPES.map((f) => {
              const selected = fuelType === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFuelType(f)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    selected
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {SUPPLIER_FUEL_LABELS[f].en} / {SUPPLIER_FUEL_LABELS[f].ur}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Litres / لیٹر</label>
          <input
            type="number"
            min="1"
            step="1"
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
            placeholder="e.g. 5000"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Note / نوٹ</label>
          <VoiceInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note / نوٹ" className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <SendIcon size={16} />
          {sending ? "Sending... / بھیجا جا رہا ہے" : "Send / بھیجیں"}
        </button>
      </form>
    </Card>
  );
}

function CredentialsCard({ supplierId, username }: { supplierId: string; username: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  // The password is fetched from the server when the owner asks for it, and kept only in this component.
  async function fetchPassword(): Promise<string | null> {
    setError("");
    try {
      const response = await fetch(`/api/pumpadmin/suppliers/${supplierId}/reveal`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to load the password");
      const value = typeof data.password === "string" ? data.password : "";
      setPassword(value);
      return value;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    }
  }

  async function reveal() {
    if ((await fetchPassword()) !== null) setShowing(true);
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Copy failed / کاپی نہیں ہوا");
    }
  }

  return (
    <Card>
      <CardHeader title="Login details / لاگ ان کی تفصیل" subtitle="Used by the supplier to sign in / سپلائر اسی سے لاگ ان کرتا ہے" />
      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">Username / یوزر نیم</p>
            <p className="font-mono font-medium text-slate-900 dark:text-white">{username || "—"}</p>
          </div>
          <button
            type="button"
            onClick={() => copy("username", username)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <CopyIcon size={14} />
            {copied === "username" ? "Copied / کاپی ہو گیا" : "Copy / کاپی"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500">Password / پاس ورڈ</p>
            <p className="font-mono font-medium text-slate-900 dark:text-white">{showing && password !== null ? password : "••••••••"}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => (showing ? setShowing(false) : reveal())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {showing ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              {showing ? "Hide / چھپائیں" : "Show / دکھائیں"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const value = password ?? (await fetchPassword());
                if (value) await copy("password", value);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CopyIcon size={14} />
              {copied === "password" ? "Copied / کاپی ہو گیا" : "Copy / کاپی"}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

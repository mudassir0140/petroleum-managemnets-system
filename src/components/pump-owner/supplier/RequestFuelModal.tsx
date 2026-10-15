"use client";

import { useEffect, useState } from "react";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { SendIcon, TruckIcon } from "@/components/icons";
import { SUPPLIER_FUEL_LABELS, SUPPLIER_FUEL_TYPES, type SupplierFuelType } from "@/lib/supplier/types";
import { SUPPLIER_TRUCK_TYPE_LABELS } from "@/lib/supplier/types";

interface PumpTruck {
  id: string;
  truckNumber: string;
  truckType: "long" | "short" | "";
  driverName: string;
  busy: boolean;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

// Text typed into a number box. Empty or non-numeric text gives null, never NaN.
function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Money: a missing value shows a dash, never 0 and never a crash.
function money(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}` : "—";
}

// Request Fuel: the owner picks the fuel, quantity, rates, advance and one Free truck.
// The server checks every value again.
export function RequestFuelModal({ supplierId, onClose, onSent }: { supplierId: string; onClose: () => void; onSent: () => void }) {
  const [fuelType, setFuelType] = useState<SupplierFuelType | "">("");
  const [litres, setLitres] = useState("");
  const [note, setNote] = useState("");
  const [advance, setAdvance] = useState("");
  const [marketRate, setMarketRate] = useState("");
  const [offeredRate, setOfferedRate] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trucks, setTrucks] = useState<PumpTruck[] | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/pumpadmin/supplier-trucks", { cache: "no-store", credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok || !Array.isArray(data)) {
          setError(typeof data?.error === "string" ? data.error : "Could not load your trucks / ٹرک لوڈ نہیں ہو سکے");
          setTrucks([]);
          return;
        }
        setTrucks(data);
      })
      .catch(() => {
        if (active) {
          setError("Network error. Try again. / نیٹ ورک کی خرابی");
          setTrucks([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const litresValue = parseNumber(litres);
  const offeredValue = parseNumber(offeredRate);
  const amount = litresValue !== null && offeredValue !== null ? Math.round(litresValue * offeredValue * 100) / 100 : null;

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!fuelType) return setError("Choose a fuel type / ایندھن کی قسم چنیں");
    if (litresValue === null || litresValue <= 0) return setError("Enter the litres / لیٹر لکھیں");
    const advanceValue = advance.trim() === "" ? 0 : parseNumber(advance);
    if (advanceValue === null) return setError("Enter a valid advance / درست پیشگی رقم لکھیں");
    const marketValue = marketRate.trim() === "" ? null : parseNumber(marketRate);
    if (marketRate.trim() !== "" && marketValue === null) return setError("Enter a valid market rate / درست مارکیٹ ریٹ لکھیں");
    if (offeredValue === null || offeredValue <= 0) return setError("Enter the offered rate / پیش کردہ ریٹ لکھیں");
    if (!truckId) return setError("Choose a Free truck / خالی ٹرک چنیں");

    setSending(true);
    try {
      const response = await fetch("/api/pumpadmin/supplier-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplierId,
          truckId,
          fuelType,
          litres: litresValue,
          note,
          advance: advanceValue,
          marketRate: marketValue,
          offeredRate: offeredValue,
        }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Request Fuel / ایندھن منگوائیں</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The request goes to the chosen truck&apos;s driver first. / درخواست پہلے منتخب ٹرک کے ڈرائیور کو جائے گی۔
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel / منسوخ
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Type / ایندھن کی قسم</p>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Litres / لیٹر
              <input type="number" min="1" step="1" inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)} placeholder="e.g. 5000" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Advance (PKR) / پیشگی رقم (PKR)
              <input type="number" min="0" step="any" inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Market rate per litre (PKR) / مارکیٹ ریٹ فی لیٹر
              <input type="number" min="0" step="any" inputMode="decimal" value={marketRate} onChange={(e) => setMarketRate(e.target.value)} placeholder="e.g. 280" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Offered rate per litre (PKR) / پیش کردہ ریٹ فی لیٹر
              <input type="number" min="0" step="any" inputMode="decimal" value={offeredRate} onChange={(e) => setOfferedRate(e.target.value)} placeholder="e.g. 275" className={inputClass} />
            </label>
          </div>

          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Amount (litres × offered rate) / رقم (لیٹر × پیش کردہ ریٹ)</p>
            <p className="mt-1 text-lg font-bold text-amber-900 dark:text-amber-100">{money(amount)}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Note / نوٹ</p>
            <VoiceInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note / نوٹ" className={inputClass} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Truck / ٹرک منتخب کریں</p>
            {trucks === null ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading trucks... / ٹرک لوڈ ہو رہے ہیں</p>
            ) : trucks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                No trucks yet. Add one on Tankers first. / ابھی کوئی ٹرک نہیں۔ پہلے ٹینکرز پر ٹرک شامل کریں۔
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {trucks.map((t) => {
                  const selected = truckId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={t.busy || sending}
                      aria-pressed={selected}
                      onClick={() => setTruckId(t.id)}
                      className={`rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected ? "border-amber-500 ring-2 ring-amber-400" : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          <TruckIcon size={16} className="text-slate-500" />
                          {t.truckNumber || "—"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${t.busy ? "bg-red-600" : "bg-green-600"}`}
                        >
                          {t.busy ? "Busy / مصروف" : "Free / خالی"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {t.truckType ? `${SUPPLIER_TRUCK_TYPE_LABELS[t.truckType].en} / ${SUPPLIER_TRUCK_TYPE_LABELS[t.truckType].ur}` : "—"} · Driver / ڈرائیور: {t.driverName || "—"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <SendIcon size={16} />
            {sending ? "Sending... / بھیجا جا رہا ہے" : "Send request / درخواست بھیجیں"}
          </button>
        </form>
      </div>
    </div>
  );
}

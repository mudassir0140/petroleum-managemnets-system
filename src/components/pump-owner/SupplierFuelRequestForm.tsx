"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { IconPlus } from "@/components/icons";
import { calcAmount } from "@/lib/supplier/money";
import { SUPPLIER_FUEL_LABELS, type SupplierListItem } from "@/lib/supplier/types";
import { SupplierAccountModal } from "./SupplierAccountModal";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const chipBase = "rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed";
const chipOn = "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500";
const chipOff =
  "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

type FormState = {
  litres: string;
  marketRate: string;
  offeredRate: string;
  tankerDetail: string;
  fuelDateTime: string;
  notes: string;
};

// Value for <input type="datetime-local">, in the viewer's local time.
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): FormState {
  return {
    litres: "",
    marketRate: "",
    offeredRate: "",
    tankerDetail: "",
    fuelDateTime: toLocalInput(new Date()),
    notes: "",
  };
}

function Label({ en, ur }: { en: string; ur: string }) {
  return (
    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {en} <span dir="rtl" className="font-normal text-slate-500 dark:text-slate-400">/ {ur}</span>
    </span>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`${chipBase} ${active ? chipOn : chipOff}`}
    >
      {children}
    </button>
  );
}

// Pump request form for /pumpadmin/fuel-orders. Choosing a supplier saves the rates, amount,
// tanker detail, and date and time on that supplier's request record (scoped to this pump).
// "Company (default)" keeps the original company order path unchanged.
export function SupplierFuelRequestForm({ pumpId, onSuccess }: { pumpId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [companyFuel, setCompanyFuel] = useState<"petrol" | "diesel">("petrol");
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadSuppliers() {
    try {
      const response = await fetch("/api/pumpadmin/suppliers", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      // Keep the last list if the refresh fails.
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const supplier = suppliers.find((s) => s._id === supplierId);
  const amount = calcAmount(form.litres, form.offeredRate);

  const setField = useCallback((key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);
  const onTankerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setField("tankerDetail", e.target.value),
    [setField]
  );
  const onNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setField("notes", e.target.value),
    [setField]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const litres = Number(form.litres);
    if (!litres || litres <= 0) {
      setError("Enter a valid litres amount");
      return;
    }

    setLoading(true);
    try {
      let response: Response;
      if (supplier) {
        const marketRate = Number(form.marketRate);
        const offeredRate = Number(form.offeredRate);
        const when = new Date(form.fuelDateTime);
        if (!(marketRate > 0)) throw new Error("Enter the market rate (PKR)");
        if (!(offeredRate > 0)) throw new Error("Enter the offered rate (PKR)");
        if (Number.isNaN(when.getTime())) throw new Error("Enter a valid date and time");

        response = await fetch("/api/pumpadmin/supplier-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            supplierId: supplier._id,
            litres,
            marketRate,
            offeredRate,
            tankerDetail: form.tankerDetail.trim(),
            fuelDateTime: when.toISOString(),
            note: form.notes || "",
          }),
        });
      } else {
        response = await fetch("/api/pump-owner/fuel-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            pumpId,
            fuelType: companyFuel,
            quantityLitres: litres,
            notes: form.notes || undefined,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to request fuel");
      }

      setForm(emptyForm());
      setSupplierId("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Request Fuel"
        subtitle="Order fuel from the company or a supplier · ایندھن کی درخواست"
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            <IconPlus size={14} />
            Create
          </button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>
        )}

        <div>
          <Label en="Supplier / Company" ur="سپلائر / کمپنی" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!supplier} onClick={() => setSupplierId("")}>
              Company (default)
            </Chip>
            {suppliers.map((s) => (
              <Chip key={s._id} active={supplierId === s._id} onClick={() => setSupplierId(s._id)}>
                {s.companyName} · {SUPPLIER_FUEL_LABELS[s.fuelType]}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label en="Fuel Type" ur="ایندھن کی قسم" />
          <div className="mt-2 flex flex-wrap gap-2">
            {supplier ? (
              <Chip active disabled>
                {SUPPLIER_FUEL_LABELS[supplier.fuelType]}
              </Chip>
            ) : (
              (["petrol", "diesel"] as const).map((fuel) => (
                <Chip key={fuel} active={companyFuel === fuel} onClick={() => setCompanyFuel(fuel)}>
                  {SUPPLIER_FUEL_LABELS[fuel]}
                </Chip>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label en="Litres" ur="لیٹر" />
            <input
              type="number"
              min="1"
              step="1"
              value={form.litres}
              onChange={(e) => setField("litres", e.target.value)}
              className={inputClass}
              placeholder="e.g., 1000"
            />
          </div>

          {supplier && (
            <>
              <div>
                <Label en="Market Rate (PKR)" ur="مارکیٹ ریٹ (PKR)" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.marketRate}
                  onChange={(e) => setField("marketRate", e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 280"
                />
              </div>

              <div>
                <Label en="Offered Rate (PKR)" ur="پیش کردہ ریٹ (PKR)" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.offeredRate}
                  onChange={(e) => setField("offeredRate", e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 279"
                />
              </div>

              <div>
                <Label en="Amount (PKR)" ur="رقم (PKR)" />
                <input
                  type="text"
                  readOnly
                  value={amount === undefined ? "" : amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  placeholder="Auto: litres × offered rate"
                  className={`${inputClass} bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200`}
                />
              </div>

              <div>
                <Label en="Date and Time" ur="تاریخ اور وقت" />
                <input
                  type="datetime-local"
                  value={form.fuelDateTime}
                  onChange={(e) => setField("fuelDateTime", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <Label en="Fuel Tanker Detail" ur="ٹینکر کی تفصیل" />
                <div className="mt-1">
                  <VoiceInput
                    type="text"
                    value={form.tankerDetail}
                    onChange={onTankerChange}
                    placeholder="e.g., Tanker number, driver name"
                  />
                </div>
              </div>

            </>
          )}

          <div className="md:col-span-2">
            <Label en="Notes (optional)" ur="نوٹس (اختیاری)" />
            <div className="mt-1">
              <VoiceTextarea
                value={form.notes}
                onChange={onNotesChange}
                placeholder="Any special instructions..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {loading ? "Requesting... / درخواست بھیجی جا رہی ہے" : "Request Fuel / ایندھن کی درخواست"}
        </button>
      </form>

      {showCreate && (
        <SupplierAccountModal onClose={() => setShowCreate(false)} onCreated={() => window.location.reload()} />
      )}
    </Card>
  );
}

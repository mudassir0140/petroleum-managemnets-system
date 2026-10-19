"use client";

// The payment methods and the fields each one needs, shared by the owner's khata form and the client dashboard.
// The server checks the same rules again (validateMethodDetails), so this only helps the user fix a field early.
import { offlineFetch } from "@/lib/offline/outbox";
import { METHOD_LABELS, STATUS_LABELS, confirmedLabel, type PaymentMethod } from "@/lib/khata/payments";

export const FORM_METHODS: { value: PaymentMethod; en: string; ur: string }[] = [
  { value: "cash", en: "Cash", ur: "نقد" },
  { value: "cheque", en: "Cheque", ur: "چیک" },
  { value: "bank-transfer", en: "Bank transfer", ur: "بینک ٹرانسفر" },
  { value: "mobile-wallet", en: "Mobile wallet", ur: "موبائل والیٹ" },
];

export interface PaymentFieldValues {
  chequeNumber: string;
  chequeDate: string;
  bankName: string;
  bankAccount: string;
  transactionId: string;
  walletProvider: string;
  proof: File | null;
}

export const EMPTY_PAYMENT_FIELDS: PaymentFieldValues = {
  chequeNumber: "",
  chequeDate: "",
  bankName: "",
  bankAccount: "",
  transactionId: "",
  walletProvider: "",
  proof: null,
};

export const PROOF_ACCEPT = "image/jpeg,image/png,image/webp";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500";

// The text fields one method asks for, with the proof image that can be added with any of them.
export function fieldsFor(method: PaymentMethod): (keyof PaymentFieldValues)[] {
  if (method === "cheque") return ["chequeNumber", "chequeDate", "bankName"];
  if (method === "bank-transfer") return ["bankAccount", "transactionId"];
  if (method === "mobile-wallet") return ["walletProvider", "transactionId"];
  return [];
}

const LABELS: Partial<Record<keyof PaymentFieldValues, string>> = {
  chequeNumber: "Cheque number / چیک نمبر",
  chequeDate: "Cheque date / چیک کی تاریخ",
  bankName: "Bank name on cheque / بینک کا نام",
  bankAccount: "Bank account / بینک اکاؤنٹ",
  transactionId: "Transaction / reference ID / ٹرانزیکشن آئی ڈی",
  walletProvider: "Wallet provider (e.g. JazzCash, Easypaisa) / والیٹ",
};

// The fields for the chosen method. Cash needs none.
export function MethodFields({
  method,
  values,
  onChange,
  proofLabel = "Screenshot (optional) / اسکرین شاٹ",
}: {
  method: PaymentMethod;
  values: PaymentFieldValues;
  onChange: (next: PaymentFieldValues) => void;
  proofLabel?: string;
}) {
  const keys = fieldsFor(method);
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-900 dark:text-white">{METHOD_LABELS[method].en} details / تفصیلات</p>
      {keys.length === 0 && <p className="text-xs text-slate-600 dark:text-slate-400">Cash is received at once. No extra details are needed.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {keys.map((key) => (
          <label key={key} className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            {LABELS[key]}
            <input
              type={key === "chequeDate" ? "date" : "text"}
              value={String(values[key] ?? "")}
              onChange={(e) => onChange({ ...values, [key]: e.target.value })}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      {method !== "cash" && (
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {proofLabel}
          <input
            type="file"
            accept={PROOF_ACCEPT}
            onChange={(e) => onChange({ ...values, proof: e.target.files?.[0] ?? null })}
            className="mt-1 block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-white dark:text-slate-300"
          />
          <span className="mt-1 block text-[11px] text-slate-500">JPEG, PNG or WebP, up to 3 MB. You can also add it later.</span>
        </label>
      )}
    </div>
  );
}

// Returns the first missing or malformed field as a message, or null when the fields look right.
export function checkFields(method: PaymentMethod, values: PaymentFieldValues): string | null {
  for (const key of fieldsFor(method)) {
    if (!String(values[key] ?? "").trim()) return `Fill in ${String(LABELS[key] ?? key).split(" / ")[0].toLowerCase()}`;
  }
  if (values.proof && values.proof.size > 3 * 1024 * 1024) return "The image is larger than 3 MB";
  return null;
}

// Sends the proof image of a saved payment. Returns an error message, or null when it was saved.
export async function uploadProof(url: string, file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  try {
    // Queued while offline; a queued upload counts as saved and is sent when the internet returns.
    const response = await offlineFetch(url, { method: "POST", body: form });
    if (response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data.error || "The image could not be saved";
  } catch {
    return "Network error while saving the image";
  }
}

// The status as a coloured badge. A cheque that is confirmed reads "Cleared", a transfer or wallet "Verified".
export function statusText(method: string, status: string): string {
  if (status === "confirmed") return confirmedLabel(method);
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS];
  return label ? label.en : "Confirmed";
}

export function StatusBadge({ method, status }: { method: string; status: string }) {
  const tone =
    status === "bounced"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : status === "pending"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{statusText(method, status)}</span>;
}

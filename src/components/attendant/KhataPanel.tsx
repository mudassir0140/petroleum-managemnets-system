"use client";

import { useEffect, useState } from "react";
import { XIcon, SearchIcon } from "@/components/icons";
import { VoiceInput } from "@/components/ui/VoiceInput";

interface KhataAccount {
  _id: string;
  clientName: string;
  department: string;
  vehicleCount: number;
  vehicleType: string;
  pumpId: string;
  createdBy: string;
}

interface KhataEntryFormData {
  fuelType: "Petrol" | "Diesel";
  litres: string;
  vehicleNumber: string;
  driverName: string;
}

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string }> = {
  Transport: { bg: "bg-blue-100", text: "text-blue-700 dark:text-blue-300" },
  Police: { bg: "bg-red-100", text: "text-red-700 dark:text-red-300" },
  Farmer: { bg: "bg-green-100", text: "text-green-700 dark:text-green-300" },
  "Ambulance / Hospital": {
    bg: "bg-amber-100",
    text: "text-amber-700 dark:text-amber-300",
  },
};

export function KhataPanel({
  isOpen,
  onClose,
  pumpId,
  petrolRate,
  dieselRate,
}: {
  isOpen: boolean;
  onClose: () => void;
  pumpId: string;
  petrolRate: number;
  dieselRate: number;
}) {
  const [accounts, setAccounts] = useState<KhataAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<KhataAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<KhataAccount | null>(
    null
  );
  const [formData, setFormData] = useState<KhataEntryFormData>({
    fuelType: "Petrol",
    litres: "",
    vehicleNumber: "",
    driverName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchAccounts, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, pumpId]);

  useEffect(() => {
    const filtered = accounts.filter(
      (acc) =>
        acc.clientName.toLowerCase().includes(search.toLowerCase()) ||
        acc.department.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAccounts(filtered);
  }, [search, accounts]);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendant/khata-accounts?pumpId=${pumpId}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch khata accounts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (
      !selectedAccount ||
      !formData.litres ||
      !formData.vehicleNumber ||
      !formData.driverName
    ) {
      setError("All fields are required");
      return;
    }

    const rate =
      formData.fuelType === "Petrol" ? petrolRate : dieselRate;

    try {
      setSubmitting(true);
      setError("");
      const response = await fetch("/api/attendant/khata-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          khataClientId: selectedAccount._id,
          fuelType: formData.fuelType,
          litres: formData.litres,
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          givenRate: rate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create entry");
      }

      setSuccess("Entry saved successfully!");
      setFormData({
        fuelType: "Petrol",
        litres: "",
        vehicleNumber: "",
        driverName: "",
      });
      setSelectedAccount(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-lg dark:bg-slate-900">
        <div className="sticky top-0 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Khata Accounts / کھاتہ اکاؤنٹس
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          {!selectedAccount && (
            <div className="space-y-2">
              <VoiceInput
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="p-4">
          {selectedAccount ? (
            /* New Entry Form */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                ← Back to accounts
              </button>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedAccount.clientName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedAccount.department}
                </p>
              </div>

              <form onSubmit={handleSubmitEntry} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
                    {success}
                  </div>
                )}

                {/* Fuel Type Buttons */}
                <div className="flex gap-2">
                  {(["Petrol", "Diesel"] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setFormData({ ...formData, fuelType: fuel })}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        formData.fuelType === fuel
                          ? "bg-amber-500 text-white"
                          : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>

                {/* Litres */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Litres / لیٹر
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.litres}
                    onChange={(e) =>
                      setFormData({ ...formData, litres: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Vehicle No. / گاڑی نمبر
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleNumber: e.target.value })
                    }
                    placeholder="ABC-1234"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                {/* Driver Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Driver Name / ڈرائیور کا نام
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) =>
                      setFormData({ ...formData, driverName: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                {/* Date/Time (Auto) */}
                <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Date & Time / تاریخ و وقت
                  </p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">
                    {new Date().toLocaleString()}
                  </p>
                </div>

                {/* Amount (Auto-calculated) */}
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Amount / رقم
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-100">
                    Rs.{" "}
                    {formData.litres
                      ? (
                          parseFloat(formData.litres) *
                          (formData.fuelType === "Petrol"
                            ? petrolRate
                            : dieselRate)
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  {submitting ? "Saving..." : "Save Entry / درج کریں"}
                </button>
              </form>
            </div>
          ) : (
            /* Khata Accounts List */
            <div className="space-y-3">
              {filteredAccounts.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                  {loading ? "Loading..." : "No khata accounts found"}
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const colors =
                    DEPARTMENT_COLORS[account.department] || DEPARTMENT_COLORS.Transport;
                  return (
                    <button
                      key={account._id}
                      onClick={() => setSelectedAccount(account)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/10"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {account.clientName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          {account.department}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {account.vehicleCount} {account.vehicleType}
                          {account.vehicleCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        New Entry / نئی انٹری →
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

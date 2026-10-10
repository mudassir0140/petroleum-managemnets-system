"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { IconArrowLeft, IconSearch, IconPlus } from "@/components/icons";

interface KhataAccount {
  _id: string;
  clientName: string;
  department: string;
  numberOfVehicles?: number;
  vehicleTypes?: string[];
  petrolGivenRate?: number;
  dieselGivenRate?: number;
  pumpId: string;
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
  "Ambulance / Hospital": { bg: "bg-amber-100", text: "text-amber-700 dark:text-amber-300" },
};

export default function KhataPage() {
  const [accounts, setAccounts] = useState<KhataAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<KhataAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<KhataAccount | null>(null);
  const [formData, setFormData] = useState<KhataEntryFormData>({
    fuelType: "Petrol",
    litres: "",
    vehicleNumber: "",
    driverName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pumpId, setPumpId] = useState<string>("");

  // Get pump ID from session and fetch accounts
  useEffect(() => {
    const getPumpIdAndFetch = async () => {
      try {
        const sessionResponse = await fetch("/api/attendant/session");
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          setPumpId(session.pumpId);
          await fetchAccounts(session.pumpId);
        }
      } catch (err) {
        console.error("Error getting pump ID:", err);
        setLoading(false);
      }
    };

    getPumpIdAndFetch();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      if (pumpId) fetchAccounts(pumpId);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = accounts.filter(
      (acc) =>
        acc.clientName.toLowerCase().includes(search.toLowerCase()) ||
        acc.department.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredAccounts(filtered);
  }, [search, accounts]);

  async function fetchAccounts(pId: string) {
    try {
      const response = await fetch(`/api/attendant/khata-accounts?pumpId=${pId}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch khata accounts:", err);
      setError("Failed to load khata accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;

    if (!formData.litres || !formData.vehicleNumber || !formData.driverName) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const rate =
        formData.fuelType === "Petrol"
          ? selectedAccount.petrolGivenRate || 0
          : selectedAccount.dieselGivenRate || 0;

      const response = await fetch("/api/khata/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          khataClientId: selectedAccount._id,
          fuelType: formData.fuelType,
          litres: parseFloat(formData.litres),
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          givenRate: rate,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) throw new Error("Failed to add entry");

      setSuccess("Entry added successfully!");
      setFormData({ fuelType: "Petrol", litres: "", vehicleNumber: "", driverName: "" });
      setSelectedAccount(null);

      // Refresh accounts
      if (pumpId) await fetchAccounts(pumpId);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Link href="/dashboard/attendant/attendance" className="flex items-center gap-2 mb-4 text-brand-500 hover:text-brand-600">
          <IconArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata accounts...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/attendant/attendance" className="flex items-center gap-2 mb-4 text-brand-500 hover:text-brand-600 transition-colors">
        <IconArrowLeft size={16} />
        <span className="hidden sm:inline">Back</span>
        <span className="hidden sm:inline text-ink-muted">/</span>
        <span className="hidden sm:inline">واپس</span>
      </Link>

      <PageHeader
        title="Khata Accounts / کھاتہ اکاؤنٹس"
        description="Add fuel entries to khata accounts"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {!selectedAccount ? (
        <>
          <div className="mb-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name or department..."
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {filteredAccounts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No khata accounts found / کوئی کھاتہ اکاؤنٹ نہیں ملا
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((account) => {
                const deptColor = DEPARTMENT_COLORS[account.department] || {
                  bg: "bg-gray-100",
                  text: "text-gray-700 dark:text-gray-300",
                };
                return (
                  <button
                    key={account._id}
                    onClick={() => setSelectedAccount(account)}
                    className="rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:shadow-lg hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {account.clientName}
                      </h3>
                      <IconPlus size={18} className="text-amber-500" />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${deptColor.bg} ${deptColor.text}`}
                      >
                        {account.department}
                      </span>
                    </div>

                    {(account.numberOfVehicles || account.vehicleTypes?.length) && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        <p>
                          Vehicles: {account.numberOfVehicles || 0} · {(account.vehicleTypes || []).join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-slate-100 p-2 dark:bg-slate-700">
                        <p className="text-slate-600 dark:text-slate-400">Petrol Rate</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Rs {(account.petrolGivenRate || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded bg-slate-100 p-2 dark:bg-slate-700">
                        <p className="text-slate-600 dark:text-slate-400">Diesel Rate</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Rs {(account.dieselGivenRate || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card className="max-w-2xl">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  New Entry / نئی انٹری
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedAccount.clientName}
                </p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitEntry} className="space-y-4 p-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Fuel Type / ایندھن کی قسم
              </label>
              <div className="flex gap-2">
                {["Petrol", "Diesel"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, fuelType: type as "Petrol" | "Diesel" })}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      formData.fuelType === type
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Litres / لیٹر
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.litres}
                onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Vehicle Number / گاڑی کا نمبر
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="e.g. ABC-123"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Driver Name / ڈرائیور کا نام
              </label>
              <VoiceInput
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel / منسوخ کریں
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {submitting ? "Submitting..." : "Add Entry / انٹری شامل کریں"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { IconPlus, IconX } from "@/components/icons";

interface FuelRates {
  petrol: number;
  diesel: number;
  lastUpdated: string;
}

export default function CreateKhataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rates, setRates] = useState<FuelRates>({ petrol: 0, diesel: 0, lastUpdated: "" });
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [showNewDept, setShowNewDept] = useState(false);
  const [newDept, setNewDept] = useState("");

  const departments = ["Police", "Hospital", "Farmer", "Truck"];

  const [formData, setFormData] = useState({
    clientName: "",
    department: "Police",
    phone: "",
    password: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    petrolGivenRate: "",
    dieselGivenRate: "",
  });

  useEffect(() => {
    fetchRates();
    fetchExistingUsernames();
  }, []);

  async function fetchRates() {
    try {
      const response = await fetch("/api/fuel-price");
      if (response.ok) {
        const data = await response.json();
        setRates({
          petrol: data.petrol || 0,
          diesel: data.diesel || 0,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error fetching rates:", err);
    }
  }

  async function fetchExistingUsernames() {
    try {
      const response = await fetch("/api/khata/clients/usernames");
      if (response.ok) {
        const data = await response.json();
        setExistingUsernames(data.usernames || []);
      }
    } catch (err) {
      console.error("Error fetching usernames:", err);
    }
  }

  function generateUsername(name: string): string {
    if (!name) return "";
    let base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);

    let username = base;
    let counter = 1;

    while (existingUsernames.includes(username)) {
      username = base + counter;
      counter++;
    }

    return username;
  }

  const generatedUsername = generateUsername(formData.clientName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.clientName || !formData.phone || !formData.password || !formData.amount) {
      setError("Please fill all required fields");
      return;
    }

    if (parseFloat(formData.amount) < 0) {
      setError("Amount must be positive");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const selectedDept = showNewDept ? newDept : formData.department;
      if (!selectedDept) {
        setError("Please select or add a department");
        return;
      }

      const response = await fetch("/api/khata/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.clientName,
          department: selectedDept,
          phone: formData.phone,
          password: formData.password,
          username: generatedUsername,
          date: formData.date,
          openingAmount: parseFloat(formData.amount),
          petrolActualRate: rates.petrol,
          petrolGivenRate: formData.petrolGivenRate ? parseFloat(formData.petrolGivenRate) : rates.petrol,
          dieselActualRate: rates.diesel,
          dieselGivenRate: formData.dieselGivenRate ? parseFloat(formData.dieselGivenRate) : rates.diesel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create khata");
      }

      const newKhata = await response.json();
      setSuccess("Khata created successfully!");

      // Show credentials for 3 seconds before redirecting
      setTimeout(() => {
        router.push("/admin/khata");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Khata / کھاتہ بنائیں"
        description="Create a new khata client account"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-200">
          {success}
        </div>
      )}

      <Card>
        <CardHeader title="Khata Client Information / کھاتہ کی معلومات" />
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Client Name / کلائنٹ کا نام *
              </label>
              <VoiceInput
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                Department / شعبہ *
              </label>
              {!showNewDept ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setFormData({ ...formData, department: dept })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          formData.department === dept
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewDept(true)}
                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                  >
                    <IconPlus size={16} />
                    Add New Department
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Enter new department"
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, department: newDept });
                      setShowNewDept(false);
                      setNewDept("");
                    }}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Phone Number / فون نمبر *
              </label>
              <VoiceInput
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Login Information */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Login Credentials / لاگ ان کی معلومات</h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Username / صارف نام (Auto-generated)
              </label>
              <input
                type="text"
                readOnly
                value={generatedUsername}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                This username is generated automatically from the client name
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Password / پاس ورڈ *
              </label>
              <VoiceInput
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password (will be shown to client once)"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Opening Transaction */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Opening Transaction / شروعات کی لین دین</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Date / تاریخ *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Opening/Advance Amount (PKR) / رقم *
                </label>
                <VoiceInput
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Fuel Rates */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fuel Rates / ایندھن کی شرح</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Actual rate is today's live rate and updates automatically. Given rate is fixed and set manually.</p>

            {/* Petrol Rates */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Petrol / پیٹرول</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Actual Rate / حقیقی شرح (Read-only)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={rates.petrol.toFixed(2)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Today's live market rate</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Given Rate / دی گئی شرح (Fixed)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.petrolGivenRate}
                    onChange={(e) => setFormData({ ...formData, petrolGivenRate: e.target.value })}
                    placeholder={rates.petrol.toFixed(2)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manual entry (default: actual rate)</p>
                </div>
              </div>
            </div>

            {/* Diesel Rates */}
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Diesel / ڈیزل</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Actual Rate / حقیقی شرح (Read-only)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={rates.diesel.toFixed(2)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Today's live market rate</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Given Rate / دی گئی شرح (Fixed)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dieselGivenRate}
                    onChange={(e) => setFormData({ ...formData, dieselGivenRate: e.target.value })}
                    placeholder={rates.diesel.toFixed(2)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manual entry (default: actual rate)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {loading ? "Creating..." : "Create Khata Client"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

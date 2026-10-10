"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { RatesHeader } from "@/components/attendant/RatesHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconPlus } from "@/components/icons";

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  numberOfVehicles: number;
  vehicleTypes: string[];
}

interface FuelEntry {
  _id: string;
  khataClientId: string;
  fuelType: string;
  litres: number;
  vehicleNumber: string;
  driverName: string;
  amount: number;
  date: string;
}

export default function AttendantKhataPage() {
  const [clients, setClients] = useState<KhataClient[]>([]);
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dailyRate, setDailyRate] = useState({ petrol: 0, diesel: 0 });
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [formData, setFormData] = useState({
    fuelType: "Petrol",
    litres: "",
    vehicleNumber: "",
    driverName: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [clientsRes, ratesRes] = await Promise.all([
        fetch("/api/khata/clients"),
        fetch("/api/attendant/rates"),
      ]);

      if (!clientsRes.ok) throw new Error("Failed to fetch khata clients");
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setDailyRate({
          petrol: ratesData.petrol || 0,
          diesel: ratesData.diesel || 0,
        });
      }

      // Fetch entries
      const entriesRes = await fetch("/api/khata/entries");
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedClient || !formData.litres || !formData.vehicleNumber) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setError("");
      const rate = formData.fuelType === "Petrol" ? dailyRate.petrol : dailyRate.diesel;

      const response = await fetch("/api/khata/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          khataClientId: selectedClient,
          fuelType: formData.fuelType,
          litres: parseFloat(formData.litres),
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          attendantId: "ATT-014", // From session
          attendantName: "Fuel Attendant",
          dailyRate: rate,
        }),
      });

      if (!response.ok) throw new Error("Failed to add entry");

      setSuccess("Fuel entry added successfully!");
      setFormData({ fuelType: "Petrol", litres: "", vehicleNumber: "", driverName: "" });
      setSelectedClient("");
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div>
      <BackButton href="/attendant/dashboard" />
      <RatesHeader />
      <PageHeader
        title="Khata Entries / کھاتہ داخلہ"
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

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <IconPlus size={18} />
          Add Fuel Entry
        </button>
      ) : null}

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="Add Fuel Entry / ایندھن کی داخلہ" />
          <form onSubmit={handleAddEntry} className="space-y-5 p-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                Select Khata Client / کھاتہ منتخب کریں *
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client._id}
                    type="button"
                    onClick={() => setSelectedClient(client._id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition ${
                      selectedClient === client._id
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {client.clientName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {client.department} | {client.numberOfVehicles} vehicle{client.numberOfVehicles > 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                Fuel Type / ایندھن کی قسم *
              </label>
              <div className="flex gap-2">
                {["Petrol", "Diesel"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, fuelType: type })}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      formData.fuelType === type
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Litres / لیٹر *
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
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Rate: PKR {(formData.fuelType === "Petrol" ? dailyRate.petrol : dailyRate.diesel).toFixed(2)}/L |
                Amount: PKR {(parseFloat(formData.litres || "0") * (formData.fuelType === "Petrol" ? dailyRate.petrol : dailyRate.diesel)).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Vehicle Number / گاڑی نمبر *
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="e.g., ABC-123"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Driver Name / ڈرائیور کا نام
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Driver name (optional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                Add Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Recent Entries */}
      {loading ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading entries...
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No Entries Yet"
          description="Start adding fuel entries to khata accounts"
        />
      ) : (
        <Card>
          <CardHeader title="Today's Entries / آج کی داخلہ" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {entries.slice(0, 20).map((entry) => (
              <div key={entry._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {entry.vehicleNumber}
                      </span>
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {entry.fuelType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {entry.litres} L | Driver: {entry.driverName || "N/A"}
                    </p>
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                    PKR {entry.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { IconPlus, IconX, IconSearch, IconDroplet, IconWallet, IconClipboard, IconCheck } from "@/components/icons";
import { formatCurrency } from "@/lib/format";

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  phone: string;
  petrolGivenRate: number;
  dieselGivenRate: number;
  totalFuelAmount: number;
  remainingBalance: number;
  createdAt: string;
}

interface FuelRates {
  petrol: number;
  diesel: number;
  lastUpdated: string;
}

export default function KhataPage() {
  const [clients, setClients] = useState<KhataClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<KhataClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rates, setRates] = useState<FuelRates>({ petrol: 0, diesel: 0, lastUpdated: "" });
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [showNewDept, setShowNewDept] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [pumpName, setPumpName] = useState<string>("");
  const [copiedUsername, setCopiedUsername] = useState(false);

  const departments = ["Police", "Hospital", "Farmer", "Truck"];

  const [formData, setFormData] = useState({
    clientName: "",
    department: "Police",
    phone: "",
    password: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
  });

  useEffect(() => {
    fetchClients();
    fetchRates();
    fetchExistingUsernames();
  }, []);

  useEffect(() => {
    const filtered = clients.filter((client) =>
      client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  async function fetchClients() {
    try {
      setLoading(true);
      const response = await fetch("/api/khata/clients");
      if (!response.ok) throw new Error("Failed to fetch khata clients");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }

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
          petrolGivenRate: Math.max(0, rates.petrol - 1),
          dieselActualRate: rates.diesel,
          dieselGivenRate: Math.max(0, rates.diesel - 1),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create khata");
      }

      const newClient = await response.json();
      setClients([newClient, ...clients]);
      setExistingUsernames([...existingUsernames, generatedUsername]);

      setFormData({
        clientName: "",
        department: "Police",
        phone: "",
        password: "",
        date: new Date().toISOString().split("T")[0],
        amount: "",
      });
      setShowForm(false);
      setShowNewDept(false);
      setNewDept("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      "Police": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "Hospital": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "Farmer": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "Truck": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[dept] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div>
      <PageHeader
        title="Khata / کھاتہ"
        description="Manage customer credit and khata client accounts"
      />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <IconX size={18} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone or department / نام یا فون سے تلاش کریں"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setError("");
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 whitespace-nowrap"
          >
            <IconPlus size={18} />
            Create Khata / کھاتہ بنائیں
          </button>
        )}
      </div>

      {clients.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Khata Accounts</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Fuel Amount</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(clients.reduce((sum, c) => sum + (c.totalFuelAmount || 0), 0))}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Balance Due</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(clients.reduce((sum, c) => sum + (c.remainingBalance || 0), 0))}
            </p>
          </Card>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 sm:p-0">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Create Khata Client / کھاتہ بنائیں
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Create a new khata client account with login credentials
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setShowNewDept(false);
                  setNewDept("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
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
                    Generated from client name
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
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

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
                      Amount (PKR) / رقم *
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

              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fuel Rates / ایندھن کی شرح (Fixed at creation)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">These rates are locked at account creation</p>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Petrol / پیٹرول</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Actual Rate / حقیقی شرح
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={(rates.petrol || 0).toFixed(2)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Today's market rate</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Given Rate / دی گئی شرح
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={Math.max(0, (rates.petrol || 0) - 1).toFixed(2)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Market rate minus Rs 1</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Diesel / ڈیزل</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Actual Rate / حقیقی شرح
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={(rates.diesel || 0).toFixed(2)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Today's market rate</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Given Rate / دی گئی شرح
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={Math.max(0, (rates.diesel || 0) - 1).toFixed(2)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Market rate minus Rs 1</p>
                    </div>
                  </div>
                </div>
              </div>

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
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setShowNewDept(false);
                    setNewDept("");
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata clients...
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No khata clients found / کوئی کھاتہ نہیں" : "No khata clients yet / ابھی کوئی کھاتہ نہیں"}
          description={searchQuery ? "Try a different search" : "Create your first khata client account"}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {filteredClients.map((client) => (
            <Link key={client._id} href={`/pumpadmin/khata/${client._id}`}>
              <Card className="p-4 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <IconWallet size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {client.clientName}
                </p>
                <div className="mt-2 flex-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDepartmentColor(client.department)}`}>
                    {client.department}
                  </span>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Balance / بقایا
                  </p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(client.remainingBalance || 0)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

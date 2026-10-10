"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconPlus, IconX } from "@/components/icons";
import { formatRate } from "@/lib/format";

interface KhataEntry {
  _id: string;
  fuelType: string;
  litres: number;
  vehicleNumber: string;
  driverName: string;
  attendantName: string;
  amount: number;
  givenRate: number;
  actualRate: number;
  date: string;
  time: string;
}

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  phone: string;
  petrolActualRate: number;
  petrolGivenRate: number;
  dieselActualRate: number;
  dieselGivenRate: number;
  totalFuelAmount: number;
  remainingBalance: number;
  createdAt: string;
}

export default function AdminKhataPage() {
  const [clients, setClients] = useState<KhataClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState<KhataClient | null>(null);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [fuelFilter, setFuelFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [attendantFilter, setAttendantFilter] = useState<string>("");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const response = await fetch("/api/khata/clients");
      if (!response.ok) throw new Error("Failed to fetch khata clients");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function openClientDetail(client: KhataClient) {
    setSelectedClient(client);
    setEntriesLoading(true);
    setFuelFilter("");
    setDateFilter({ start: "", end: "" });
    setAttendantFilter("");
    try {
      const response = await fetch(`/api/khata/entries?clientId=${client._id}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
    } finally {
      setEntriesLoading(false);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (fuelFilter && entry.fuelType !== fuelFilter) return false;
    if (attendantFilter && entry.attendantName !== attendantFilter) return false;
    if (dateFilter.start && new Date(entry.date) < new Date(dateFilter.start)) return false;
    if (dateFilter.end && new Date(entry.date) > new Date(dateFilter.end)) return false;
    return true;
  });

  const uniqueAttendants = Array.from(new Set(entries.map((e) => e.attendantName)));
  const totalLitres = filteredEntries.reduce((sum, e) => sum + e.litres, 0);
  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Khata Clients / کھاتہ کلائنٹس"
        description="Manage all khata client accounts"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/admin/khata/create"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <IconPlus size={18} />
          Create Khata / کھاتہ بنائیں
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata clients...
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No Khata Clients Yet / ابھی کوئی کھاتہ نہیں"
          description="Create your first khata client account"
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {clients.map((client) => (
            <button
              key={client._id}
              onClick={() => openClientDetail(client)}
              className="text-left"
            >
              <Card className="p-4 hover:shadow-lg dark:hover:shadow-lg/30 transition h-full cursor-pointer border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {client.clientName}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{client.department}</p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Petrol (Given):</span>
                    <span className="font-semibold text-slate-900 dark:text-white">PKR {formatRate(client.petrolGivenRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Diesel (Given):</span>
                    <span className="font-semibold text-slate-900 dark:text-white">PKR {formatRate(client.dieselGivenRate)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Balance:</span>
                      <span className={`font-semibold ${(client.remainingBalance ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        PKR {formatRate(client.remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedClient.clientName}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedClient.department}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Rates */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Fuel Rates / ایندھن کی شرح</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Petrol - Actual (Today)</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">PKR {formatRate(selectedClient.petrolActualRate)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300">Petrol - Given (Fixed)</p>
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-200">PKR {formatRate(selectedClient.petrolGivenRate)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Diesel - Actual (Today)</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">PKR {formatRate(selectedClient.dieselActualRate)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300">Diesel - Given (Fixed)</p>
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-200">PKR {formatRate(selectedClient.dieselGivenRate)}</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Filters / فلٹرز</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {["Petrol", "Diesel"].map((fuel) => (
                      <button
                        key={fuel}
                        onClick={() => setFuelFilter(fuelFilter === fuel ? "" : fuel)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          fuelFilter === fuel
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueAttendants.map((attendant) => (
                      <button
                        key={attendant}
                        onClick={() => setAttendantFilter(attendantFilter === attendant ? "" : attendant)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          attendantFilter === attendant
                            ? "bg-blue-500 text-white"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        }`}
                      >
                        {attendant}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                      className="px-3 py-1 rounded text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                      className="px-3 py-1 rounded text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Entry History / درج ہسٹری</h3>
                {entriesLoading ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">Loading entries...</p>
                ) : filteredEntries.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No entries found</p>
                ) : (
                  <>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Date</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Fuel</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Vehicle</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Driver</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Litres</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Rate</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Amount</th>
                            <th className="px-3 py-2 font-semibold text-slate-900 dark:text-white">Attendant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredEntries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{new Date(entry.date).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{entry.fuelType}</td>
                              <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{entry.vehicleNumber}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{entry.driverName}</td>
                              <td className="px-3 py-2 font-semibold text-amber-600 dark:text-amber-400">{formatRate(entry.litres)}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{formatRate(entry.givenRate)}</td>
                              <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">PKR {formatRate(entry.amount)}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{entry.attendantName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex justify-between text-sm font-semibold">
                      <span className="text-slate-900 dark:text-white">Total Litres: {formatRate(totalLitres)}</span>
                      <span className="text-amber-600 dark:text-amber-400">Total: PKR {formatRate(totalAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

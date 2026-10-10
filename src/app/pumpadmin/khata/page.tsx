"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import { IconPlus, IconTrash2, IconEdit, IconX, IconSearch, IconDroplet, IconWallet, IconCheck, IconAlertTriangle } from "@/components/icons";
import { formatCurrency, formatDateShort } from "@/lib/format";

interface KhataEntry {
  _id: string;
  customerName: string;
  phone: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export default function KhataPage() {
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<KhataEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    // Filter entries based on search query
    const filtered = entries.filter((entry) =>
      entry.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.phone.includes(searchQuery)
    );
    setFilteredEntries(filtered);
  }, [entries, searchQuery]);

  async function fetchEntries() {
    try {
      setLoading(true);
      const response = await fetch("/api/pumpadmin/khata");
      if (!response.ok) throw new Error("Failed to fetch khata entries");
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.amount) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const url = editingId
        ? `/api/pumpadmin/khata/${editingId}`
        : "/api/pumpadmin/khata";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          phone: formData.phone,
          amount: parseFloat(formData.amount),
          date: formData.date,
          note: formData.note,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingId ? "update" : "create"} entry`);
      const newEntry = await response.json();

      if (editingId) {
        setEntries(entries.map((e) => (e._id === editingId ? newEntry : e)));
        setEditingId(null);
      } else {
        setEntries([newEntry, ...entries]);
      }

      setFormData({
        customerName: "",
        phone: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      setShowForm(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const response = await fetch(`/api/pumpadmin/khata/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete entry");
      setEntries(entries.filter((e) => e._id !== id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  function handleEdit(entry: KhataEntry) {
    setFormData({
      customerName: entry.customerName,
      phone: entry.phone,
      amount: entry.amount.toString(),
      date: entry.date.split("T")[0],
      note: entry.note,
    });
    setEditingId(entry._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      customerName: "",
      phone: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    setError("");
  }

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalEntries = entries.length;

  return (
    <div>
      <PageHeader
        title="Khata / کھاتہ"
        description="Manage customer credit and debt records"
      />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <IconAlertTriangle size={18} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Accounts</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalEntries}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <IconDroplet size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Credit Amount</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <IconWallet size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Active Records</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalEntries}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <IconCheck size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg. Credit</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalEntries > 0 ? totalAmount / totalEntries : 0)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <IconWallet size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone / نام یا فون سے تلاش کریں"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                customerName: "",
                phone: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                note: "",
              });
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 whitespace-nowrap"
          >
            <IconPlus size={18} />
            Add Entry / شامل کریں
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 sm:p-0">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingId ? "Edit Entry / ترمیم کریں" : "Add New Khata / نیا شامل کریں"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {editingId ? "Update customer credit record" : "Create a new customer credit record"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Customer Name / کسٹمر کا نام *
                </label>
                <VoiceInput
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Amount (PKR) / رقم *
                  </label>
                  <VoiceInput
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    Date / تاریخ *
                  </label>
                  <VoiceInput
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Notes / نوٹس
                </label>
                <VoiceTextarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add notes or special remarks"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  {loading ? "Saving..." : editingId ? "Update Entry" : "Create Entry"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Entries List */}
      {loading && !showForm ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading khata records...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No results found / کوئی نتیجہ نہیں" : "No khata records yet / ابھی کوئی کھاتہ نہیں"}
          description={searchQuery ? "Try a different search" : "Create your first customer credit record."}
        />
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <Card key={entry._id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {entry.customerName}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{entry.phone}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Amount</p>
                      <p className="mt-0.5 text-lg font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(entry.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">
                        {formatDateShort(entry.date)}
                      </p>
                    </div>
                    {entry.note && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Note</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                          {entry.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="rounded-lg p-2.5 text-slate-600 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                    title="Edit"
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="rounded-lg p-2.5 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <IconTrash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

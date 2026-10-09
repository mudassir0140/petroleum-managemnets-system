"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/ui/States";
import { IconPlus, IconTrash2, IconEdit2 } from "@/components/icons";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  }

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <BackButton />
      <PageHeader title="Khata" description="Manage customer credit and debt records." />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {!showForm ? (
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
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <IconPlus size={16} />
          Add New Entry
        </button>
      ) : (
        <Card className="mb-6">
          <CardHeader
            title={editingId ? "Edit Entry" : "Add New Khata Entry"}
            subtitle={editingId ? "Update customer credit record" : "Create a new customer credit record"}
          />
          <form onSubmit={handleSubmit} className="space-y-4 p-5 pt-0">
            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Phone
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Amount (PKR)
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Note
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : editingId ? "Update Entry" : "Create Entry"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {entries.length > 0 && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">Total Credit</p>
            <p className="text-2xl font-bold text-ink-primary">{formatCurrency(totalAmount)}</p>
          </div>
        </Card>
      )}

      {loading && !showForm ? (
        <div className="text-center text-sm text-ink-muted">Loading...</div>
      ) : entries.length === 0 ? (
        <EmptyState title="No khata entries" description="Create your first customer credit record." />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{entry.customerName}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{entry.phone}</p>
                  <p className="mt-2 text-lg font-bold text-brand-500">{formatCurrency(entry.amount)}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatDateShort(entry.date)}</p>
                  {entry.note && <p className="mt-2 text-xs text-ink-secondary">{entry.note}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 hover:text-brand-500"
                  >
                    <IconEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 hover:text-rose-600"
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

"use client";

import { useState } from "react";

export function AddPumpBranchForm({
  ownerName,
  ownerEmail,
  phone,
  address,
  city,
  onSuccess,
  onCancel,
}: {
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    pumpName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.pumpName.trim()) {
      setError("Pump name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/pumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.pumpName.trim(),
          companyName: "", // Can be added later
          ownerName,
          ownerEmail,
          password: `${ownerName.trim()}123`,
          phone,
          address,
          city,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create pump");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Pump Branch Name *
        </label>
        <input
          type="text"
          value={form.pumpName}
          onChange={(e) => setForm({ ...form, pumpName: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-700 dark:text-white"
          placeholder="e.g., Main Branch, Downtown, East Wing"
          disabled={loading}
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Pre-filled Information:</p>
        <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p><strong>Owner:</strong> {ownerName}</p>
          <p><strong>Email:</strong> {ownerEmail}</p>
          <p><strong>Phone:</strong> {phone}</p>
          <p><strong>Address:</strong> {address}, {city}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            Password will be auto-generated as: <code className="bg-slate-200 px-1 dark:bg-slate-600">{ownerName.trim()}123</code>
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Branch"}
        </button>
      </div>
    </form>
  );
}

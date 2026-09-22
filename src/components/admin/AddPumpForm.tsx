"use client";

import { useState, useMemo } from "react";

interface AddPumpFormProps {
  onSuccess?: () => void;
}

function generateEmail(ownerName: string, pumpName: string): string {
  if (!ownerName || !pumpName) return "";
  const cleanOwner = ownerName.toLowerCase().trim();
  const cleanPump = pumpName.toLowerCase().trim().replace(/\s+/g, "");
  return `${cleanOwner}@${cleanPump}gmail.com`;
}

function generatePassword(ownerName: string): string {
  const cleanName = ownerName.trim().charAt(0).toUpperCase() + ownerName.trim().slice(1);
  return `${cleanName}123`;
}

export function AddPumpForm({ onSuccess }: AddPumpFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const [formData, setFormData] = useState({
    pumpName: "",
    companyName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
  });

  const generatedEmail = useMemo(() => generateEmail(formData.ownerName, formData.pumpName), [formData.ownerName, formData.pumpName]);
  const generatedPassword = useMemo(() => generatePassword(formData.ownerName), [formData.ownerName]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!generatedEmail || !generatedPassword || !formData.pumpName || !formData.ownerName) {
      setError("Pump name and owner name are required");
      setLoading(false);
      return;
    }

    try {
      // Use MongoDB API endpoint
      const response = await fetch("/api/admin/pumps-mongodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.pumpName,
          companyName: formData.companyName || undefined,
          ownerName: formData.ownerName,
          ownerEmail: generatedEmail,
          password: generatedPassword,
          phone: formData.phone || "N/A",
          address: formData.address || "N/A",
          city: formData.city || "N/A",
          status: "Online",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create pump");
      }

      setCreatedCredentials({
        email: generatedEmail,
        password: generatedPassword,
      });
      setShowCredentials(true);
      setSuccess(`Pump "${formData.pumpName}" created successfully!`);

      setFormData({
        pumpName: "",
        companyName: "",
        ownerName: "",
        phone: "",
        address: "",
        city: "",
      });

      onSuccess?.();
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

      {success && (
        <div className="space-y-3">
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>

          {showCredentials && createdCredentials && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-200">
                Pump Owner Login Credentials (Share with Owner)
              </p>
              <div className="space-y-2 rounded bg-white p-3 font-mono text-sm dark:bg-slate-900">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Email: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Password: </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{createdCredentials.password}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                ℹ️ Share these credentials with the pump owner. They can log in immediately.
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Pump Name *
        </label>
        <input
          type="text"
          value={formData.pumpName}
          onChange={(e) => setFormData({ ...formData, pumpName: e.target.value })}
          placeholder="e.g., Khan Petroleum Agency"
          required
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Company Name
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="e.g., Khan Petroleum Pvt Ltd"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Pump Owner Name *
        </label>
        <input
          type="text"
          value={formData.ownerName}
          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
          placeholder="e.g., Mudassir"
          required
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="e.g., +92 300 1234567"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Address
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="e.g., 123 Main Street"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          City
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="e.g., Karachi"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {(formData.pumpName || formData.ownerName) && (
        <div className="space-y-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Auto-Generated Credentials</p>
          <div className="space-y-1 font-mono text-sm">
            <div>
              <span className="text-amber-700 dark:text-amber-300">Email: </span>
              <span className="font-semibold text-amber-900 dark:text-amber-100">{generatedEmail || "—"}</span>
            </div>
            <div>
              <span className="text-amber-700 dark:text-amber-300">Password: </span>
              <span className="font-semibold text-amber-900 dark:text-amber-100">{generatedPassword || "—"}</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
      >
        {loading ? "Creating..." : "Create Pump"}
      </button>
    </form>
  );
}

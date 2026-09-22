"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Modal } from "@/components/dashboard/modal";
import { PlusIcon } from "@/components/icons";

interface Manager {
  managerId: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  pumpId: string;
  pumpName: string;
  createdAt: string;
}

interface Pump {
  pumpId: string;
  pumpName: string;
}

interface ManagerCredentials {
  email: string;
  password: string;
  managerName: string;
  pumpName: string;
}

export default function ManagersManagementPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<ManagerCredentials | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    managerName: "",
    contactNumber: "",
    address: "",
    pumpId: "",
  });

  useEffect(() => {
    loadManagers();
    loadPumps();
  }, [refreshKey]);

  async function loadManagers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/legacy/managers");
      const data = await response.json();
      if (data.success) {
        setManagers(data.managers || []);
      }
    } catch (error) {
      console.error("Failed to load managers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPumps() {
    try {
      const response = await fetch("/api/admin/legacy/pumps");
      const data = await response.json();
      if (data.success) {
        setPumps(data.pumps || []);
      }
    } catch (error) {
      console.error("Failed to load pumps:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.managerName || !formData.contactNumber || !formData.address || !formData.pumpId) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/admin/legacy/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create manager");
        return;
      }

      setCredentials({
        email: data.credentials.email,
        password: data.credentials.password,
        managerName: formData.managerName,
        pumpName: pumps.find((p) => p.pumpId === formData.pumpId)?.pumpName || formData.pumpId,
      });

      setShowCredentials(true);
      setShowForm(false);
      setFormData({ managerName: "", contactNumber: "", address: "", pumpId: "" });
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to create manager:", error);
      alert("Failed to create manager");
    }
  }

  async function handleDelete(managerId: string) {
    if (!window.confirm("Are you sure you want to delete this manager?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/legacy/managers?managerId=${managerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRefreshKey((k) => k + 1);
      } else {
        alert("Failed to delete manager");
      }
    } catch (error) {
      console.error("Failed to delete manager:", error);
      alert("Failed to delete manager");
    }
  }

  function copyToClipboard(text: string, type: "email" | "password") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Management"
        description="Create and manage pump owner managers with auto-generated login credentials"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Add New Manager" className="lg:col-span-1">
          <div className="p-6">
            <button
              onClick={() => setShowForm(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              <PlusIcon className="size-3.5" />
              Create Manager
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Managers List" className="lg:col-span-2">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                Loading managers...
              </div>
            ) : managers.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                No managers created yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Pump
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {managers.map((manager) => (
                    <tr key={manager.managerId} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {manager.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {manager.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {manager.pumpName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {manager.contactNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(manager.managerId)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>
      </div>

      {showForm && (
        <Modal title="Create New Manager" onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Manager Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="e.g. Khan, Ahmed"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Pump <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.pumpId}
                onChange={(e) => setFormData({ ...formData, pumpId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select a pump</option>
                {pumps.map((pump) => (
                  <option key={pump.pumpId} value={pump.pumpId}>
                    {pump.pumpName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Contact Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="e.g. +92 300 1234567"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Address <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Create Manager
            </button>
          </form>
        </Modal>
      )}

      {showCredentials && credentials && (
        <Modal title="Manager Credentials Generated" onClose={() => setShowCredentials(false)}>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Manager <strong>{credentials.managerName}</strong> has been created for{" "}
                <strong>{credentials.pumpName}</strong>. Share these credentials with the manager.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.email}
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.email, "email")}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      copied === "email"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    {copied === "email" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.password}
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.password, "password")}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      copied === "password"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    {copied === "password" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/30">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Important:</strong> The manager can now log in using these credentials. They will have access
                only to their assigned pump.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCredentials(false)}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

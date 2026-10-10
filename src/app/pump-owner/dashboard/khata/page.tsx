"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconPlus, IconChevronRight } from "@/components/icons";

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  username: string;
  numberOfVehicles: number;
  vehicleTypes: string[];
  totalFuelAmount: number;
  totalPaid: number;
  advancePaid: number;
  remainingBalance: number;
}

export default function KhataPage() {
  const [clients, setClients] = useState<KhataClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    department: "Transport",
    numberOfVehicles: "1",
    vehicleTypes: ["Big Truck"],
  });
  const [newDepartment, setNewDepartment] = useState("");
  const [showNewDepartment, setShowNewDepartment] = useState(false);

  const departments = ["Transport", "Police", "Farmer", "Ambulance / Hospital"];

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

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();

    const selectedDepartment = showNewDepartment ? newDepartment : formData.department;

    if (!formData.clientName || !selectedDepartment || !formData.vehicleTypes.length) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setError("");
      const response = await fetch("/api/khata/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.clientName,
          department: selectedDepartment,
          numberOfVehicles: parseInt(formData.numberOfVehicles),
          vehicleTypes: formData.vehicleTypes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create khata client");
      const newClient = await response.json();
      setClients([newClient, ...clients]);

      // Show credentials
      alert(`Khata Client Created!\n\nUsername: ${newClient.username}\nPassword: ${newClient.password}\n\nPlease save these credentials!`);

      setFormData({
        clientName: "",
        department: "Transport",
        numberOfVehicles: "1",
        vehicleTypes: ["Big Truck"],
      });
      setShowForm(false);
      setShowNewDepartment(false);
      setNewDepartment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div>
      <PageHeader
        title="Khata / کھاتہ"
        description="Manage customer khata accounts and fuel entries"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <IconPlus size={18} />
          Create New Khata Client
        </button>
      ) : null}

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="Create Khata Client / نیا کھاتہ بنائیں" />
          <form onSubmit={handleCreateClient} className="space-y-5 p-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Client Name / کلائنٹ کا نام *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Enter client name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                Department / شعبہ *
              </label>
              {!showNewDepartment ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, department: dept });
                          setShowNewDepartment(false);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
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
                    onClick={() => setShowNewDepartment(true)}
                    className="mt-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                  >
                    + Add New Department
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Enter new department"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, department: newDepartment });
                      setShowNewDepartment(false);
                    }}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Number of Vehicles / گاڑیوں کی تعداد *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfVehicles}
                onChange={(e) => setFormData({ ...formData, numberOfVehicles: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-3">
                Vehicle Types / گاڑی کی اقسام *
              </label>
              <div className="flex flex-wrap gap-2">
                {["Big Truck", "Car", "Van", "Bus", "Motorcycle"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        vehicleTypes: formData.vehicleTypes.includes(type)
                          ? formData.vehicleTypes.filter((t) => t !== type)
                          : [...formData.vehicleTypes, type],
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      formData.vehicleTypes.includes(type)
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                Create Khata Client
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

      {loading ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata clients...
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No Khata Clients Yet"
          description="Create your first khata client to start managing fuel accounts"
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Link
              key={client._id}
              href={`/pump-owner/dashboard/khata/${client._id}`}
              className="block"
            >
              <Card className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {client.clientName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {client.department}
                      </span>
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {client.numberOfVehicles} vehicle{client.numberOfVehicles > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Total Fuel: PKR {client.totalFuelAmount.toFixed(2)} | Remaining: PKR {client.remainingBalance.toFixed(2)}
                    </p>
                  </div>
                  <IconChevronRight size={18} className="text-slate-400 dark:text-slate-600 shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

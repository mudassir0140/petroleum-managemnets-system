"use client";

import { useState, useEffect } from "react";
import { AddPumpForm } from "@/components/admin/AddPumpForm";
import { PumpDetailModal } from "@/components/admin/PumpDetailModal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";

export default function PumpsManagementPage() {
  const [pumps, setPumps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPump, setSelectedPump] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadPumps();
  }, [refreshKey]);

  async function loadPumps() {
    setLoading(true);
    try {
      // Use MongoDB API endpoint
      const response = await fetch("/api/admin/pumps-mongodb");
      const data = await response.json();
      if (data.success) {
        // Convert MongoDB pumps to display format
        const displayPumps = (data.pumps || []).map((pump: any) => ({
          pumpId: pump._id,
          id: pump._id,
          pumpName: pump.name,
          name: pump.name,
          ownerName: pump.ownerName,
          ownerEmail: pump.ownerEmail,
          phone: pump.phone,
          address: pump.address,
          city: pump.city,
          status: pump.status,
          petrolStock: pump.petrolStock,
          petrolCapacity: pump.petrolCapacity,
          dieselStock: pump.dieselStock,
          dieselCapacity: pump.dieselCapacity,
          createdAt: pump.createdAt,
          updatedAt: pump.updatedAt,
        }));
        setPumps(displayPumps);
      }
    } catch (error) {
      console.error("Failed to load pumps:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleViewDetails(pump: any) {
    setSelectedPump(pump);
    setModalOpen(true);
  }

  async function handleResetPassword(pumpId: string) {
    try {
      const response = await fetch("/api/admin/pumps/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pumpId }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      const data = await response.json();
      if (data.success && data.password) {
        const updatedPump = { ...selectedPump, password: data.password };
        setSelectedPump(updatedPump);
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  async function handleDelete(pumpId: string) {
    if (!window.confirm("Are you sure you want to delete this pump?")) {
      return;
    }

    try {
      // Use MongoDB API endpoint
      const response = await fetch(`/api/admin/pumps-mongodb`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pumpId }),
      });

      if (response.ok) {
        setRefreshKey((k) => k + 1);
        setModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete pump:", error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Management"
        description="Add and manage fuel pump stations"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Add New Pump" className="lg:col-span-1">
          <div className="p-6">
            <AddPumpForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          </div>
        </SectionCard>

        <SectionCard title="Pumps List" className="lg:col-span-2">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                Loading pumps...
              </div>
            ) : pumps.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                No pumps created yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Pump Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Owner Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Owner Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {pumps.map((pump) => (
                    <tr
                      key={pump.pumpId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {pump.pumpName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {pump.ownerName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {pump.ownerEmail}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {pump.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleViewDetails(pump)}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDelete(pump.pumpId)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </SectionCard>
      </div>

      <PumpDetailModal
        pump={selectedPump}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPump(null);
        }}
        onPasswordReset={handleResetPassword}
      />
    </div>
  );
}

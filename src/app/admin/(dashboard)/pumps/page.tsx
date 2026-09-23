"use client";

import { useState, useEffect } from "react";
import { AddPumpForm } from "@/components/admin/AddPumpForm";
import { AddPumpBranchForm } from "@/components/admin/AddPumpBranchForm";
import { PumpDetailModal } from "@/components/admin/PumpDetailModal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";

export default function PumpsManagementPage() {
  const [pumps, setPumps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPump, setSelectedPump] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);

  useEffect(() => {
    loadPumps();
  }, [refreshKey]);

  async function loadPumps() {
    setLoading(true);
    try {
      // Use MongoDB API endpoint
      const response = await fetch("/api/admin/pumps", { credentials: "include" });
      const data = await response.json();
      if (data.success) {
        // Convert MongoDB pumps to display format
        const displayPumps = (data.pumps || []).map((pump: any) => ({
          pumpId: pump._id,
          id: pump._id,
          pumpName: pump.name,
          name: pump.name,
          companyName: pump.companyName,
          ownerName: pump.ownerName,
          ownerEmail: pump.ownerEmail,
          phone: pump.phone,
          address: pump.address,
          city: pump.city,
          status: pump.status,
          accountStatus: pump.accountStatus ?? "active",
          petrolStock: pump.petrolStock,
          petrolCapacity: pump.petrolCapacity,
          dieselStock: pump.dieselStock,
          dieselCapacity: pump.dieselCapacity,
          createdAt: pump.createdAt,
          updatedAt: pump.updatedAt,
        }));
        setPumps(displayPumps);
      } else {
        console.error("Failed to load pumps:", data.error);
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
      // Single source of truth: MongoDB `pumps` collection via admin/pumps PUT.
      // Password convention matches AddPumpForm.generatePassword(): {Owner}123.
      const pump = pumps.find((p) => p.pumpId === pumpId);
      const newPassword = `${(pump?.ownerName || "Owner").trim()}123`;

      const response = await fetch("/api/admin/pumps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pumpId, password: newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      const updatedPump = { ...selectedPump, password: newPassword };
      setSelectedPump(updatedPump);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  async function handleToggleAccountStatus(pump: any) {
    const nextStatus = pump.accountStatus === "inactive" ? "active" : "inactive";
    try {
      const response = await fetch("/api/admin/pumps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pumpId: pump.pumpId, accountStatus: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Failed to update account status:", data.error);
        return;
      }
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to update account status:", error);
    }
  }

  async function handleDelete(pumpId: string) {
    if (!window.confirm("Are you sure you want to delete this pump?")) {
      return;
    }

    try {
      // Use MongoDB API endpoint — DELETE takes pumpId as a query param, not a JSON body
      const response = await fetch(`/api/admin/pumps?pumpId=${encodeURIComponent(pumpId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setRefreshKey((k) => k + 1);
        setModalOpen(false);
      } else {
        const data = await response.json().catch(() => ({}));
        console.error("Failed to delete pump:", data.error);
      }
    } catch (error) {
      console.error("Failed to delete pump:", error);
    }
  }

  // Group pumps by owner email to detect multiple pumps per owner
  const pumpsByOwner = pumps.reduce<Record<string, any[]>>((acc, pump) => {
    const key = pump.ownerEmail;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pump);
    return acc;
  }, {});

  async function handleShowMorePumps(ownerEmail: string) {
    const ownerPumps = pumpsByOwner[ownerEmail];
    // If only one pump, just view its details
    if (ownerPumps.length === 1) {
      handleViewDetails(ownerPumps[0]);
      return;
    }
    // If multiple, show a dropdown-like modal or use a confirm dialog
    const selectedName = window.prompt(
      `Select a pump for ${ownerEmail}:\n\n${ownerPumps.map((p, i) => `${i + 1}. ${p.pumpName}`).join("\n")}`
    );
    if (!selectedName) return;
    const selected = ownerPumps.find((p) => p.pumpName === selectedName);
    if (selected) handleViewDetails(selected);
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
              <div className="space-y-1">
                {Object.entries(pumpsByOwner).map(([ownerEmail, ownerPumps]) => (
                  <div key={ownerEmail} className="border-b border-slate-200 dark:border-slate-700">
                    {/* Owner header row */}
                    <div className="flex items-center justify-between bg-slate-50 px-6 py-3 dark:bg-slate-800">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {ownerPumps[0].ownerName} ({ownerPumps.length} branch{ownerPumps.length !== 1 ? "es" : ""})
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ownerEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOwner(ownerPumps[0]);
                          setShowBranchForm(true);
                        }}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                      >
                        + Add More Pump
                      </button>
                    </div>

                    {/* Pump branches for this owner */}
                    <div className="space-y-1">
                      {ownerPumps.map((pump) => (
                        <div
                          key={pump.pumpId}
                          className="ml-6 flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              📍 {pump.pumpName}
                              {pump.companyName && (
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-2">
                                  ({pump.companyName})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {pump.address} · {pump.city}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              {pump.status}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                pump.accountStatus === "inactive"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                              }`}
                            >
                              {pump.accountStatus === "inactive" ? "Inactive" : "Active"}
                            </span>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleViewDetails(pump)}
                              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-sm font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleToggleAccountStatus(pump)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              {pump.accountStatus === "inactive" ? "Activate" : "Deactivate"}
                            </button>
                            <button
                              onClick={() => handleDelete(pump.pumpId)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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

      {showBranchForm && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Add Pump Branch
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              For: <span className="font-medium">{selectedOwner.ownerName}</span> ({selectedOwner.ownerEmail})
            </p>
            <AddPumpBranchForm
              ownerName={selectedOwner.ownerName}
              ownerEmail={selectedOwner.ownerEmail}
              phone={selectedOwner.phone}
              address={selectedOwner.address}
              city={selectedOwner.city}
              onSuccess={() => {
                setShowBranchForm(false);
                setSelectedOwner(null);
                setRefreshKey((k) => k + 1);
              }}
              onCancel={() => {
                setShowBranchForm(false);
                setSelectedOwner(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

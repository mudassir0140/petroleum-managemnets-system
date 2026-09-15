"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlusIcon, XIcon } from "@/components/icons";
import type { Pump } from "@/lib/manager/types";

interface AdminPumpFormProps {
  mode: "create" | "edit";
  pump?: Pump;
  onSuccess: () => void;
}

export function AdminPumpForm({ mode, pump, onSuccess }: AdminPumpFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: pump?.name || "",
    code: pump?.code || "",
    address: pump?.address || "",
    city: pump?.city || "",
    ownerName: pump?.ownerName || "",
    ownerPhone: pump?.ownerPhone || "",
    ownerId: pump?.ownerId || "",
    status: (pump?.status || "open") as "open" | "low-stock" | "closed",
    petrolStock: pump?.stocks?.find(s => s.fuel === "petrol")?.stockLiters || 0,
    petrolCapacity: pump?.stocks?.find(s => s.fuel === "petrol")?.capacityLiters || 5000,
    dieselStock: pump?.stocks?.find(s => s.fuel === "diesel")?.stockLiters || 0,
    dieselCapacity: pump?.stocks?.find(s => s.fuel === "diesel")?.capacityLiters || 5000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Pump name is required";
    if (!formData.code.trim()) newErrors.code = "Pump code is required";
    if (!formData.address.trim()) newErrors.address = "Location is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!formData.ownerPhone.trim()) newErrors.ownerPhone = "Contact number is required";
    if (formData.petrolStock < 0) newErrors.petrolStock = "Petrol stock cannot be negative";
    if (formData.dieselStock < 0) newErrors.dieselStock = "Diesel stock cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // In a real app, this would make an API call
    console.log("Form submitted:", formData);
    setIsOpen(false);
    onSuccess();
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <PlusIcon size={18} />
        {mode === "create" ? "Add New Pump" : "Edit Pump"}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-1 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink-primary">
                  {mode === "create" ? "Add New Pump" : "Edit Pump"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {mode === "create"
                    ? "Create a new fuel pump station in your network"
                    : "Update pump details and inventory"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-ink-muted hover:bg-surface-2"
              >
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Pump Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., Al-Falah Fuel Station"
                    />
                    {errors.name && <p className="mt-1 text-xs text-critical-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Pump Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., PUMP-014"
                    />
                    {errors.code && <p className="mt-1 text-xs text-critical-500">{errors.code}</p>}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-4">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., Ferozepur Road"
                    />
                    {errors.address && <p className="mt-1 text-xs text-critical-500">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., Lahore"
                    />
                    {errors.city && <p className="mt-1 text-xs text-critical-500">{errors.city}</p>}
                  </div>
                </div>
              </div>

              {/* Pump Owner Information */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-4">Pump Owner</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., Fahad Malik"
                    />
                    {errors.ownerName && <p className="mt-1 text-xs text-critical-500">{errors.ownerName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g., 03001234567"
                    />
                    {errors.ownerPhone && <p className="mt-1 text-xs text-critical-500">{errors.ownerPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Pump Status */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-4">Pump Status</h3>
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "open" | "low-stock" | "closed" })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="open">Open</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Fuel Inventory */}
              <div>
                <h3 className="text-sm font-semibold text-ink-primary mb-4">Fuel Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Petrol Stock (Liters)
                    </label>
                    <input
                      type="number"
                      value={formData.petrolStock}
                      onChange={(e) => setFormData({ ...formData, petrolStock: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="0"
                    />
                    {errors.petrolStock && <p className="mt-1 text-xs text-critical-500">{errors.petrolStock}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Petrol Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      value={formData.petrolCapacity}
                      onChange={(e) => setFormData({ ...formData, petrolCapacity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Diesel Stock (Liters)
                    </label>
                    <input
                      type="number"
                      value={formData.dieselStock}
                      onChange={(e) => setFormData({ ...formData, dieselStock: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="0"
                    />
                    {errors.dieselStock && <p className="mt-1 text-xs text-critical-500">{errors.dieselStock}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                      Diesel Capacity (Liters)
                    </label>
                    <input
                      type="number"
                      value={formData.dieselCapacity}
                      onChange={(e) => setFormData({ ...formData, dieselCapacity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-ink-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-border-subtle pt-6">
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-4 py-2 text-sm font-medium text-ink-primary hover:bg-surface-3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {mode === "create" ? "Create Pump" : "Update Pump"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

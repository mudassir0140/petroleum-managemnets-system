"use client";

import { useState } from "react";
import { grantPermission } from "@/lib/admin/permission-actions";
import { FEATURES, getCategories, getFeaturesByCategory, type FeatureId } from "@/lib/admin/permissions";

interface PermissionGrantDialogProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function PermissionGrantDialog({ onSuccess, onCancel }: PermissionGrantDialogProps) {
  const [formData, setFormData] = useState({
    userId: "",
    userEmail: "",
    featureId: "" as FeatureId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.userId || !formData.userEmail || !formData.featureId) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await grantPermission(
        formData.userId,
        formData.userEmail,
        formData.featureId,
        "Admin User",
        "admin@petromanage.demo"
      );

      if (result.success) {
        setFormData({ userId: "", userEmail: "", featureId: "" as FeatureId });
        onSuccess?.();
      } else {
        setError(result.error || "Failed to grant permission");
      }
    } catch (err) {
      setError("An error occurred while granting permission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink-primary mb-2">
          User ID
        </label>
        <input
          type="text"
          placeholder="e.g., USR-001"
          value={formData.userId}
          onChange={(e) => {
            setFormData({ ...formData, userId: e.target.value });
            setError(null);
          }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-primary mb-2">
          User Email
        </label>
        <input
          type="email"
          placeholder="e.g., user@example.com"
          value={formData.userEmail}
          onChange={(e) => {
            setFormData({ ...formData, userEmail: e.target.value });
            setError(null);
          }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-primary mb-2">
          Feature / Permission
        </label>
        <select
          value={formData.featureId}
          onChange={(e) => {
            setFormData({ ...formData, featureId: e.target.value as FeatureId });
            setError(null);
          }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          disabled={loading}
        >
          <option value="">Select a feature...</option>
          {getCategories().map((category) => (
            <optgroup key={category} label={category}>
              {getFeaturesByCategory(category).map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name} - {feature.description}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium text-sm transition"
        >
          {loading ? "Granting..." : "Grant Permission"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-neutral-300 text-ink-primary rounded-lg hover:bg-neutral-50 disabled:bg-gray-100 font-medium text-sm transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

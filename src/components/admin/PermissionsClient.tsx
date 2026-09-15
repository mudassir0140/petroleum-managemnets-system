"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { grantPermission, revokePermission } from "@/lib/admin/permission-actions";
import { getCategories, getFeaturesByCategory, type FeatureId, FEATURES } from "@/lib/admin/permissions";
import type { UserPermissions } from "@/lib/admin/permissions";
import { PermissionGrantDialog } from "./PermissionGrantDialog";

interface PermissionsClientProps {
  initialPermissions: UserPermissions[];
  allFeatures: typeof FEATURES;
}

export function PermissionsClient({ initialPermissions, allFeatures }: PermissionsClientProps) {
  const [permissions, setPermissions] = useState<UserPermissions[]>(initialPermissions);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleGrantSuccess() {
    setMessage({ type: "success", text: "Permission granted successfully" });
    setShowGrantDialog(false);

    // Reload permissions
    try {
      const response = await fetch("/api/admin/permissions");
      const data = await response.json();
      setPermissions(data);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to reload permissions" });
    }
  }

  async function handleRevokePermission(userId: string, featureId: FeatureId) {
    if (!confirm("Are you sure you want to revoke this permission?")) return;

    try {
      const result = await revokePermission(
        userId,
        featureId,
        "Admin User",
        "admin@petromanage.demo"
      );

      if (result.success) {
        setMessage({ type: "success", text: "Permission revoked successfully" });

        // Update local state
        const updated = permissions.map((p) => {
          if (p.userId === userId) {
            return {
              ...p,
              customPermissions: p.customPermissions.filter((f) => f !== featureId),
            };
          }
          return p;
        }).filter((p) => p.customPermissions.length > 0);

        setPermissions(updated);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to revoke permission" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error revoking permission" });
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader
          title="Grant Permissions to User"
          subtitle="Select a user and feature to grant access"
          action={
            !showGrantDialog && (
              <button
                onClick={() => setShowGrantDialog(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium"
              >
                Grant Permission
              </button>
            )
          }
        />
        {showGrantDialog && (
          <div className="p-6 border-t">
            <PermissionGrantDialog
              onSuccess={handleGrantSuccess}
              onCancel={() => setShowGrantDialog(false)}
            />
          </div>
        )}
      </Card>

      {permissions.length > 0 && (
        <Card>
          <CardHeader
            title="Manage User Permissions"
            subtitle={`${permissions.length} users have been granted additional permissions`}
          />
          <div className="space-y-4 p-6">
            {permissions.map((perm) => (
              <div key={perm.userId} className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-ink-primary">{perm.userEmail}</p>
                    <p className="text-xs text-ink-secondary">User ID: {perm.userId}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone="warning">{`Granted: ${new Date(perm.grantedAt).toLocaleDateString()}`}</Badge>
                    {perm.grantedBy && <p className="text-xs text-ink-secondary mt-1 text-right">By: {perm.grantedBy}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perm.customPermissions.map((featureId) => {
                    const feature = allFeatures.find((f) => f.id === featureId);
                    return (
                      <div key={featureId} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-sm">
                        <span className="text-blue-900 font-medium">{feature?.name}</span>
                        <button
                          onClick={() => handleRevokePermission(perm.userId, featureId)}
                          className="ml-1 text-red-600 hover:text-red-800 font-bold text-lg leading-none hover:scale-110 transition"
                          title="Revoke permission"
                          aria-label="Revoke permission"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

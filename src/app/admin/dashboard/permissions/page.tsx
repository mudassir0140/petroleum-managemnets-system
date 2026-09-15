import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, type Column } from "@/components/ui/Table";
import { getAdminSession } from "@/lib/admin/session";
import { simulateLatency } from "@/lib/utils";
import { FEATURES, type FeatureId } from "@/lib/admin/permissions";
import { getAllPermissions } from "@/lib/admin/permission-actions";
import { PermissionsClient } from "@/components/admin/PermissionsClient";

interface PermissionUI {
  featureId: FeatureId;
  featureName: string;
  category: string;
  description: string;
  usersCount: number;
}

export default async function PermissionsPage() {
  await simulateLatency();
  const session = await getAdminSession();

  const allPermissions = await getAllPermissions();

  const permissionsData: PermissionUI[] = FEATURES.map((feature) => ({
    featureId: feature.id,
    featureName: feature.name,
    category: feature.category,
    description: feature.description,
    usersCount: allPermissions.filter((p) => p.customPermissions.includes(feature.id)).length,
  }));

  const permissionColumns: Column<PermissionUI>[] = [
    { header: "Feature", cell: (row) => <span className="font-medium text-ink-primary">{row.featureName}</span> },
    { header: "Category", cell: (row) => <Badge tone="warning">{row.category}</Badge> },
    { header: "Description", cell: (row) => <span className="text-sm text-ink-secondary">{row.description}</span> },
    { header: "Users Granted", align: "right", cell: (row) => <span className="font-semibold text-brand-500">{row.usersCount}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Management"
        description="Grant and revoke specific feature access to users. Customize permissions beyond their base role."
      />

      <PermissionsClient
        initialPermissions={allPermissions}
        allFeatures={FEATURES}
      />

      <Card>
        <CardHeader title="Available Features" subtitle={`${permissionsData.length} features in system`} />
        <Table columns={permissionColumns} rows={permissionsData} rowKey={(row) => row.featureId} />
      </Card>

      {allPermissions.length > 0 && (
        <Card>
          <CardHeader
            title="Users with Custom Permissions"
            subtitle={`${allPermissions.length} users have granted permissions`}
          />
          <div className="space-y-4 p-6">
            {allPermissions.map((perm) => (
              <div key={perm.userId} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-ink-primary">{perm.userEmail}</p>
                    <p className="text-sm text-ink-secondary">ID: {perm.userId}</p>
                  </div>
                  <Badge tone="info">Granted: {new Date(perm.grantedAt).toLocaleDateString()}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perm.customPermissions.map((featureId) => {
                    const feature = FEATURES.find((f) => f.id === featureId);
                    return (
                      <div key={featureId} className="flex items-center gap-2 bg-neutral-100 px-3 py-1 rounded-full text-sm">
                        <span>{feature?.name}</span>
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

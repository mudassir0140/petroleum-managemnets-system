"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShieldCheckIcon } from "@/components/icons";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";
import { ROLES, type RoleSlug } from "@/lib/roles";

type PermissionMatrix = Record<string, RoleSlug[]>;

function initialMatrix(): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  for (const item of DASHBOARD_NAV) {
    matrix[item.href] = "roles" in item ? [...item.roles] : ROLES.map((r) => r.slug);
  }
  return matrix;
}

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix>(initialMatrix);

  function toggle(href: string, role: RoleSlug) {
    setMatrix((prev) => {
      const current = prev[href] ?? [];
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, [href]: next };
    });
  }

  const totalModules = DASHBOARD_NAV.length;
  const fullyOpenModules = Object.values(matrix).filter((roles) => roles.length === ROLES.length).length;
  const restrictedModules = totalModules - fullyOpenModules;
  const avgRolesPerModule = Math.round(
    (Object.values(matrix).reduce((sum, roles) => sum + roles.length, 0) / totalModules) * 10,
  ) / 10;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Which roles can access each dashboard module — reflects the live navigation configuration. Toggle to simulate a change for this session."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dashboard modules" value={String(totalModules)} icon={ShieldCheckIcon} />
        <StatCard label="Roles configured" value={String(ROLES.length)} />
        <StatCard label="Open to every role" value={String(fullyOpenModules)} />
        <StatCard label="Restricted modules" value={String(restrictedModules)} hint={`avg. ${avgRolesPerModule} roles/module`} />
      </div>

      <SectionCard
        title="Module access matrix"
        description="Click a cell to grant or revoke a role's access to that module for this demo session"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Module</th>
                {ROLES.map((role) => (
                  <th key={role.slug} className="px-2 py-3 text-center font-medium whitespace-nowrap">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {DASHBOARD_NAV.map((item) => {
                const granted = matrix[item.href] ?? [];
                return (
                  <tr key={item.href} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{item.label}</td>
                    {ROLES.map((role) => {
                      const has = granted.includes(role.slug);
                      return (
                        <td key={role.slug} className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(item.href, role.slug)}
                            className={`w-20 rounded-md px-2 py-1 text-xs font-semibold transition ${
                              has
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            }`}
                          >
                            {has ? "Allowed" : "None"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

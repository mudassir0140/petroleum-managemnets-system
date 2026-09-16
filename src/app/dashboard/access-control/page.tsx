// @ts-nocheck
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { LockIcon } from "@/components/icons";
import { DEFAULT_ACCESS_GRANTS, EXTRA_FEATURES, type ExtraFeature } from "@/lib/dashboard/data/access-control";
import { EMPLOYEES } from "@/lib/dashboard/data/employees";

export default function AccessControlPage() {
  const [grants, setGrants] = useState<Record<string, ExtraFeature[]>>(DEFAULT_ACCESS_GRANTS);

  function toggle(employeeId: string, feature: ExtraFeature) {
    setGrants((prev) => {
      const current = prev[employeeId] ?? [];
      const next = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];
      return { ...prev, [employeeId]: next };
    });
  }

  const totalGrants = Object.values(grants).reduce((sum, list) => sum + list.length, 0);
  const employeesWithAccess = Object.values(grants).filter((list) => list.length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Access Control"
        description="Grant or remove feature-based access for any employee, without changing their main role."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={String(EMPLOYEES.length)} icon={LockIcon} />
        <StatCard label="Employees with extra access" value={String(employeesWithAccess)} />
        <StatCard label="Active feature grants" value={String(totalGrants)} hint={`out of ${EMPLOYEES.length * EXTRA_FEATURES.length} possible`} />
        <StatCard label="Extra features available" value={String(EXTRA_FEATURES.length)} />
      </div>

      <SectionCard
        title="Employee access"
        description="Click a feature chip to grant or remove it for that employee — changes apply immediately for this demo session."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Main role</th>
                {EXTRA_FEATURES.map((feature) => (
                  <th key={feature} className="px-3 py-3 text-center font-medium whitespace-nowrap">
                    {feature}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {EMPLOYEES.map((employee) => {
                const employeeGrants = grants[employee.id] ?? [];
                return (
                  <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{employee.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{employee.assignedPump}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{employee.title}</td>
                    {EXTRA_FEATURES.map((feature) => {
                      const granted = employeeGrants.includes(feature);
                      return (
                        <td key={feature} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(employee.id, feature)}
                            className={`w-20 rounded-md px-2 py-1 text-xs font-semibold transition ${
                              granted
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            }`}
                          >
                            {granted ? "Granted" : "None"}
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

      <SectionCard title="Access summary">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {EMPLOYEES.filter((e) => (grants[e.id] ?? []).length > 0).map((employee) => (
            <li key={employee.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{employee.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{employee.title}</p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {(grants[employee.id] ?? []).join(", ")}
              </span>
            </li>
          ))}
          {EMPLOYEES.every((e) => (grants[e.id] ?? []).length === 0) && (
            <li className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No employees have extra access granted.
            </li>
          )}
        </ul>
      </SectionCard>
    </div>
  );
}

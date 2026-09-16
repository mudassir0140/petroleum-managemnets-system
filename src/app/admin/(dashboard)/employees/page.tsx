"use client";

import { useState, useEffect } from "react";
import { AddEmployeeForm } from "@/components/admin/AddEmployeeForm";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { ROLES } from "@/lib/roles";

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadEmployees();
  }, [refreshKey]);

  async function loadEmployees() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/employees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(employeeId: string) {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees?employeeId=${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  }

  function getRoleLabel(slug: string): string {
    return ROLES.find((r) => r.slug === slug)?.label || slug;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description="Add and manage company employees"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Add New Employee" className="lg:col-span-1">
          <div className="p-6">
            <AddEmployeeForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          </div>
        </SectionCard>

        <SectionCard title="Employees List" className="lg:col-span-2">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                Loading employees...
              </div>
            ) : employees.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                No employees created yet
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {employees.map((employee) => (
                    <tr
                      key={employee.employeeId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {getRoleLabel(employee.role)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {employee.phone}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(employee.employeeId)}
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
    </div>
  );
}

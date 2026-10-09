"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

interface Employee {
  _id: string;
  name: string;
  phone: string;
  role: string;
  shiftHours?: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const response = await fetch("/api/pumpadmin/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Employees / ملازمین"
        description="View all pump employees"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-ink-muted">Loading employees...</div>
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" description="No employees have been added to this pump yet." />
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <Card key={emp._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{emp.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{emp.phone}</p>
                  <p className="mt-1 text-xs font-medium text-brand-500 capitalize">{emp.role.replace("-", " ")}</p>
                  {emp.shiftHours && (
                    <p className="mt-1 text-xs text-ink-secondary">
                      Shift: {emp.shiftHours} hours / {emp.shiftHours} گھنٹے
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

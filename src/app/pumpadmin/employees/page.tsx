"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/ui/States";
import { IconEye, IconEyeOff, IconTrash2, IconPlus } from "@/components/icons";

interface PumpEmployee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  showPassword?: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<PumpEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "pump-attendant",
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

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

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/pumpadmin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to create employee");
      const newEmployee = await response.json();
      setEmployees([...employees, newEmployee]);
      setFormData({ name: "", email: "", phone: "", role: "pump-attendant" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const response = await fetch(`/api/pumpadmin/employees/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete employee");
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div>
      <BackButton />
      <PageHeader title="Manage Employees" description="Add and manage your pump's employees." />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <IconPlus size={16} />
          Add Employee
        </button>
      ) : (
        <Card className="mb-6">
          <CardHeader title="Add New Employee" subtitle="Create a login for a pump employee" />
          <form onSubmit={handleAddEmployee} className="space-y-4 p-5 pt-0">
            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Phone
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="pump-attendant">Pump Attendant</option>
                <option value="shift-manager">Shift Manager</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Employee"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading && !showForm ? (
        <div className="text-center text-sm text-ink-muted">Loading...</div>
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Add your first employee to get started." />
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <Card key={emp._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{emp.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{emp.email} · {emp.phone}</p>
                  <p className="mt-1 text-xs font-medium text-brand-500 capitalize">{emp.role.replace("-", " ")}</p>
                  {emp.password && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-3 p-3">
                      <input
                        type={showPasswords[emp._id] ? "text" : "password"}
                        readOnly
                        value={emp.password}
                        className="flex-1 bg-transparent text-sm font-mono outline-none"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, [emp._id]: !showPasswords[emp._id] })}
                        className="shrink-0 text-ink-muted hover:text-ink-primary"
                      >
                        {showPasswords[emp._id] ? (
                          <IconEyeOff size={16} />
                        ) : (
                          <IconEye size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEmployee(emp._id)}
                  className="shrink-0 rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 hover:text-rose-600"
                >
                  <IconTrash2 size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

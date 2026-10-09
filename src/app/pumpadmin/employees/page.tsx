"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { BackButton } from "@/components/dashboard/BackButton";
import { EmptyState } from "@/components/ui/States";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { IconEye, IconEyeOff, IconTrash2, IconPlus, IconCheck, IconX, IconClipboard, IconClock } from "@/components/icons";

interface PumpEmployee {
  _id: string;
  name: string;
  phone: string;
  role: string;
  username: string;
  password?: string;
  pumpName?: string;
  shiftHours?: number;
  createdAt: string;
}

const SHIFT_DURATION_OPTIONS = [8, 10, 12, 14, 16, 18, 20, 22, 24];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<PumpEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    role: "pump-attendant",
    shiftHours: 8,
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<PumpEmployee | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "attendance">("info");
  const [editingShiftHours, setEditingShiftHours] = useState<string | null>(null);
  const [editingShiftValue, setEditingShiftValue] = useState<number>(8);

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
      setFormData({ name: "", phone: "", password: "", role: "pump-attendant", shiftHours: 8 });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateShiftHours(employeeId: string, newShiftHours: number) {
    try {
      const response = await fetch(`/api/pumpadmin/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftHours: newShiftHours }),
      });
      if (!response.ok) throw new Error("Failed to update shift hours");
      const updated = await response.json();
      setEmployees(employees.map((e) => (e._id === employeeId ? { ...e, shiftHours: updated.shiftHours } : e)));
      if (selectedEmployee?._id === employeeId) {
        setSelectedEmployee({ ...selectedEmployee, shiftHours: updated.shiftHours });
      }
      setEditingShiftHours(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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
                Name / نام
              </label>
              <VoiceInput
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter employee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Phone / فون
              </label>
              <VoiceInput
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Password / پاس ورڈ
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary">
                Role / کردار
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

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-primary mb-2">
                <IconClock size={16} />
                Shift Duration (hours) / شفٹ کا دورانیہ (گھنٹے)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SHIFT_DURATION_OPTIONS.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setFormData({ ...formData, shiftHours: hours })}
                    className={`py-2 rounded-lg font-medium text-sm transition ${
                      formData.shiftHours === hours
                        ? "bg-brand-500 text-white"
                        : "bg-surface-3 text-ink-primary hover:bg-surface-4"
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
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
                <button
                  onClick={() => setSelectedEmployee(emp)}
                  className="flex-1 min-w-0 text-left hover:opacity-75 transition"
                >
                  <p className="text-sm font-semibold text-ink-primary">{emp.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{emp.phone}</p>
                  <p className="mt-1 text-xs font-medium text-brand-500 capitalize">{emp.role.replace("-", " ")}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-secondary">
                    <IconClock size={14} />
                    {emp.shiftHours || 8} hrs / {emp.shiftHours || 8} گھنٹے
                  </p>
                </button>
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

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle p-5">
              <h2 className="text-lg font-semibold text-ink-primary">{selectedEmployee.name}</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 hover:text-ink-primary"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex gap-0 border-b border-border-subtle">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "info"
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "attendance"
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                Attendance
              </button>
            </div>

            <div className="p-5">
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Name</label>
                    <p className="mt-1 text-sm text-ink-primary">{selectedEmployee.name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Phone</label>
                    <p className="mt-1 text-sm text-ink-primary">{selectedEmployee.phone}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Role</label>
                    <p className="mt-1 text-sm text-ink-primary capitalize">{selectedEmployee.role.replace("-", " ")}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Pump</label>
                    <p className="mt-1 text-sm text-ink-primary">{selectedEmployee.pumpName}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Shift Duration / شفٹ کا دورانیہ</label>
                    {editingShiftHours === selectedEmployee._id ? (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-5 gap-2">
                          {SHIFT_DURATION_OPTIONS.map((hours) => (
                            <button
                              key={hours}
                              type="button"
                              onClick={() => setEditingShiftValue(hours)}
                              className={`py-2 rounded-lg font-medium text-sm transition ${
                                editingShiftValue === hours
                                  ? "bg-brand-500 text-white"
                                  : "bg-surface-3 text-ink-primary hover:bg-surface-4"
                              }`}
                            >
                              {hours}h
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateShiftHours(selectedEmployee._id, editingShiftValue)}
                            className="flex-1 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingShiftHours(null)}
                            className="flex-1 rounded-lg border border-border-subtle px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-surface-3"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm text-ink-primary flex items-center gap-1">
                          <IconClock size={16} />
                          {selectedEmployee.shiftHours || 8} hours / {selectedEmployee.shiftHours || 8} گھنٹے
                        </p>
                        <button
                          onClick={() => {
                            setEditingShiftHours(selectedEmployee._id);
                            setEditingShiftValue(selectedEmployee.shiftHours || 8);
                          }}
                          className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Username</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface-3 p-3">
                      <input
                        type="text"
                        readOnly
                        value={selectedEmployee.username}
                        className="flex-1 bg-transparent text-sm font-mono outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(selectedEmployee.username, `username-${selectedEmployee._id}`)}
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {copiedField === `username-${selectedEmployee._id}` ? (
                          <IconCheck size={16} className="text-green-600" />
                        ) : (
                          <IconClipboard size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Password</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface-3 p-3">
                      <input
                        type={showPasswords[selectedEmployee._id] ? "text" : "password"}
                        readOnly
                        value={selectedEmployee.password || ""}
                        className="flex-1 bg-transparent text-sm font-mono outline-none"
                      />
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, [selectedEmployee._id]: !showPasswords[selectedEmployee._id] })}
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {showPasswords[selectedEmployee._id] ? (
                          <IconEyeOff size={16} />
                        ) : (
                          <IconEye size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(selectedEmployee.password || "", `password-${selectedEmployee._id}`)}
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {copiedField === `password-${selectedEmployee._id}` ? (
                          <IconCheck size={16} className="text-green-600" />
                        ) : (
                          <IconClipboard size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="text-center text-sm text-ink-muted">
                  <p>Attendance records will appear here</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

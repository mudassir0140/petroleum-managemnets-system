"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
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

export default function StaffPage() {
  const [employees, setEmployees] = useState<PumpEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<PumpEmployee | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "attendance">("info");
  const [editingShiftHours, setEditingShiftHours] = useState<string | null>(null);
  const [editingShiftValue, setEditingShiftValue] = useState<number>(8);

  useEffect(() => {
    fetchEmployees();

    // Live sync: refetch every 3 seconds
    const interval = setInterval(fetchEmployees, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const response = await fetch("/api/pumpadmin/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
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
      console.error("Failed to update shift hours:", err);
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
      setSelectedEmployee(null);
    } catch (err) {
      console.error("Failed to delete employee:", err);
    }
  }

  return (
    <div>
      <PageHeader title="Staff / عملہ" description="View all pump staff and employees" />

      {loading && employees.length === 0 ? (
        <div className="text-center text-sm text-ink-muted">Loading...</div>
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Staff will appear here once added." />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {employees.map((emp) => (
            <button
              key={emp._id}
              onClick={() => setSelectedEmployee(emp)}
              className="aspect-square flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-2 p-4 text-center transition hover:border-brand-500 hover:bg-surface-3"
            >
              <IconClipboard size={24} className="mb-2 text-brand-500" />
              <p className="text-xs font-semibold text-ink-primary line-clamp-2">{emp.name}</p>
              <p className="mt-1 text-xs text-ink-muted capitalize">{emp.role?.replace("-", " ") || "—"}</p>
              <p className="mt-1 text-xs text-ink-secondary truncate">{emp.phone || "—"}</p>
            </button>
          ))}
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle p-5">
              <h2 className="text-lg font-semibold text-ink-primary">{selectedEmployee.name || "—"}</h2>
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

                  <div className="pt-4 border-t border-border-subtle">
                    <button
                      onClick={() => handleDeleteEmployee(selectedEmployee._id)}
                      className="w-full rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      <IconTrash2 size={16} className="inline mr-2" />
                      Delete Employee / کارکن کو حذف کریں
                    </button>
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

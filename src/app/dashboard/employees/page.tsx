"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconEye, IconEyeOff, IconTrash2, IconPlus, IconCheck, IconUsers, IconFileText } from "@/components/icons";
import { ClipboardIcon } from "@/components/icons";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  password?: string;
  department?: string;
}

const DEMO_EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Ahmed Khan",
    email: "ahmed@example.com",
    phone: "+92-300-1234567",
    username: "ahmed.khan",
    role: "Pump Attendant",
    password: "pass123",
    department: "Operations",
  },
  {
    id: "2",
    name: "Fatima Ali",
    email: "fatima@example.com",
    phone: "+92-310-9876543",
    username: "fatima.ali",
    role: "Shift Manager",
    password: "pass456",
    department: "Management",
  },
];

const NAVIGATION_CARDS = [
  {
    title: "Staff Directory",
    titleUrdu: "عملے کی فہرست",
    description: "View all employees and their details",
    descriptionUrdu: "تمام ملازمین کی معلومات دیکھیں",
    icon: <IconUsers size={20} />,
    href: "/dashboard/employees/directory",
  },
  {
    title: "Attendance",
    titleUrdu: "حاضری",
    description: "Daily attendance and records",
    descriptionUrdu: "روزمرہ حاضری کے ریکارڈ",
    icon: <IconFileText size={20} />,
    href: "/dashboard/employees/attendance",
  },
  {
    title: "Payroll",
    titleUrdu: "تنخواہیں",
    description: "Salary and payment records",
    descriptionUrdu: "تنخواہ کی معلومات",
    icon: <IconFileText size={20} />,
    href: "/dashboard/employees/payroll",
  },
  {
    title: "Shifts",
    titleUrdu: "شفٹیں",
    description: "Shift schedules and management",
    descriptionUrdu: "شفٹ کے شیڈول",
    icon: <IconFileText size={20} />,
    href: "/dashboard/employees/shifts",
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(DEMO_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "attendance">("info");

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function deleteEmployee(id: string) {
    if (confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter((e) => e.id !== id));
      setSelectedEmployee(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees & Attendance"
        description="Staff directory, pump assignment, shifts, weekly offs and payroll."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NAVIGATION_CARDS.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="group h-full cursor-pointer transition-all hover:border-brand-300 hover:bg-surface-2">
              <div className="flex h-full flex-col justify-between p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                    {card.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary">{card.title}</p>
                  <p className="text-xs text-ink-muted">{card.titleUrdu}</p>
                  <p className="mt-3 text-xs text-ink-muted">{card.description}</p>
                  <p className="text-xs text-ink-secondary">{card.descriptionUrdu}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-primary">Employees / ملازمین</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <IconPlus size={16} />
          Add Employee
        </button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader title="Add New Employee" subtitle="Create a new employee record" />
          <div className="space-y-4 p-5 pt-0">
            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1">Name / نام</label>
              <input
                type="text"
                placeholder="Enter employee name"
                className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1">Email / ای میل</label>
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1">Phone / فون</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary mb-1">Role / کردار</label>
              <select className="w-full rounded-lg border border-border-subtle px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                <option>Pump Attendant</option>
                <option>Shift Manager</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
                Add Employee
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-semibold text-ink-primary transition hover:bg-surface-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {employees.map((emp) => (
          <button
            key={emp.id}
            onClick={() => setSelectedEmployee(emp)}
            className="text-left"
          >
            <Card className="h-full cursor-pointer transition hover:shadow-md hover:bg-surface-2">
              <div className="flex flex-col justify-between p-5 h-full">
                <div>
                  <p className="text-sm font-semibold text-ink-primary">{emp.name}</p>
                  <p className="text-xs text-ink-muted">{emp.phone}</p>
                  <p className="mt-1 text-xs font-medium text-brand-500 capitalize">{emp.role}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEmployee(emp.id);
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  <IconTrash2 size={14} />
                  Delete
                </button>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle p-5">
              <h2 className="text-lg font-semibold text-ink-primary">{selectedEmployee.name}</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-3 hover:text-ink-primary"
              >
                ✕
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
                    <label className="text-xs font-medium text-ink-muted">Email</label>
                    <p className="mt-1 text-sm text-ink-primary">{selectedEmployee.email}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Phone</label>
                    <p className="mt-1 text-sm text-ink-primary">{selectedEmployee.phone}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Role</label>
                    <p className="mt-1 text-sm text-ink-primary capitalize">{selectedEmployee.role}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Username</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface-3 p-3">
                      <input type="text" readOnly value={selectedEmployee.username} className="flex-1 bg-transparent text-sm font-mono outline-none" />
                      <button
                        onClick={() => copyToClipboard(selectedEmployee.username, `username-${selectedEmployee.id}`)}
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {copiedField === `username-${selectedEmployee.id}` ? (
                          <IconCheck size={16} className="text-green-600" />
                        ) : (
                          <ClipboardIcon size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-muted">Password</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-surface-3 p-3">
                      <input
                        type={showPasswords[selectedEmployee.id] ? "text" : "password"}
                        readOnly
                        value={selectedEmployee.password || ""}
                        className="flex-1 bg-transparent text-sm font-mono outline-none"
                      />
                      <button
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            [selectedEmployee.id]: !showPasswords[selectedEmployee.id],
                          })
                        }
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {showPasswords[selectedEmployee.id] ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(selectedEmployee.password || "", `password-${selectedEmployee.id}`)}
                        className="shrink-0 text-ink-muted hover:text-ink-primary transition"
                      >
                        {copiedField === `password-${selectedEmployee.id}` ? (
                          <IconCheck size={16} className="text-green-600" />
                        ) : (
                          <ClipboardIcon size={16} />
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

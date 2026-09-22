// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency } from "@/lib/dashboard/format";
import {
  EMPLOYEES,
  type Employee,
  type EmployeeStatus,
} from "@/lib/dashboard/data/employees";
import { getAssignableEmployeeRoles, getRoleBySlug, type RoleSlug } from "@/lib/roles";

const STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Suspended"];
const SHIFTS: Employee["shift"][] = ["Morning", "Afternoon", "Night"];
const ASSIGNABLE_ROLES = getAssignableEmployeeRoles();

type EmployeeFormState = {
  name: string;
  title: string;
  role: RoleSlug | "";
  assignedPump: string;
  shift: Employee["shift"];
  weeklyOff: string;
  phone: string;
  status: EmployeeStatus;
  salary: string;
};

function emptyForm(): EmployeeFormState {
  return {
    name: "",
    title: "",
    role: "",
    assignedPump: "",
    shift: "Morning",
    weeklyOff: "Sunday",
    phone: "",
    status: "Active",
    salary: "",
  };
}

function formFromEmployee(employee: Employee): EmployeeFormState {
  return {
    name: employee.name,
    title: employee.title,
    role: (employee.role as RoleSlug) || "",
    assignedPump: employee.assignedPump,
    shift: employee.shift,
    weeklyOff: employee.weeklyOff,
    phone: employee.phone,
    status: employee.status,
    salary: String(employee.salary),
  };
}

// Same pattern the Add Pump form uses to auto-generate pump-owner logins
// (src/app/dashboard/pumps/page.tsx generateEmail): clean + concatenate +
// a fixed domain, so both credential flows are generated the same way.
function generateEmployeeEmail(name: string, roleSlug: string): string {
  if (!name || !roleSlug) return "";
  const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const cleanRole = roleSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  return `${cleanName}@${cleanRole}gmail.com`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

// Map a MongoDB employee record onto the shape this page renders.
function fromRecord(r: any): Employee {
  const roleLabel = getRoleBySlug(r.role).label;
  return {
    id: r._id,
    name: r.name,
    title: roleLabel,
    department: roleLabel,
    role: r.role,
    assignedPump: "—",
    shift: "Morning",
    weeklyOff: "Sunday",
    phone: r.phone || "—",
    status: r.status === "active" ? "Active" : "Suspended",
    salary: 0,
    attendanceRate: 100,
    joinDate: String(r.createdAt).slice(0, 10),
    week: ["P", "P", "P", "P", "P", "P", "P"],
  };
}

export default function HrEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ name: string; role: string; email: string; password: string } | null>(null);

  // Employees live in MongoDB (single source of truth) — load whatever
  // Admin/HR has already created via this page.
  async function loadEmployees() {
    try {
      const res = await fetch("/api/admin/employees", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employees");
      setEmployees((data.employees ?? []).map(fromRecord));
    } catch (err) {
      console.error("[Employees] load failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load employees");
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchesDept = department === "All" || e.department === department;
      const matchesStatus = status === "All" || e.status === status;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, department, status]);

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const notActiveCount = employees.filter((e) => e.status !== "Active").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setShowAdd(true);
  }

  function openEdit(employee: Employee) {
    setForm(formFromEmployee(employee));
    setEditingId(employee.id);
    setError("");
    setShowAdd(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.role) {
      setError("Name and Role are required");
      return;
    }
    const salary = Number(form.salary) || 0;
    const roleLabel = getRoleBySlug(form.role).label;

    if (editingId) {
      // Editing only updates the locally-rendered row — role-based creation
      // (below) is what actually persists to MongoDB and generates logins.
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                name: form.name.trim(),
                title: form.title.trim() || roleLabel,
                department: roleLabel,
                role: form.role,
                assignedPump: form.assignedPump.trim() || e.assignedPump,
                shift: form.shift,
                weeklyOff: form.weeklyOff,
                phone: form.phone.trim() || e.phone,
                status: form.status,
                salary,
              }
            : e,
        ),
      );
      setShowAdd(false);
      setEditingId(null);
      setForm(emptyForm());
      return;
    }

    const name = form.name.trim();
    const generatedEmail = generateEmployeeEmail(name, form.role);
    const generatedPassword = generatePassword();

    const payload = {
      name,
      email: generatedEmail,
      phone: form.phone.trim() || "N/A",
      role: form.role,
      password: generatedPassword,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create employee");
        return;
      }

      setNewCredentials({ name, role: roleLabel, email: generatedEmail, password: generatedPassword });
      setShowAdd(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadEmployees();
    } catch (err) {
      console.error("[Employees] create failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Employees"
        description="Full staff directory across every department and pump."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Employee
          </button>
        }
      />

      {error && !showAdd && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>
      )}

      {newCredentials && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Login credentials generated for {newCredentials.name} ({newCredentials.role})
            </p>
            <button
              type="button"
              onClick={() => setNewCredentials(null)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2 space-y-2 font-mono text-sm">
            <div className="flex items-center justify-between">
              <div className="text-blue-800 dark:text-blue-300">
                Email: <span className="font-semibold">{newCredentials.email}</span>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(newCredentials.email)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-blue-800 dark:text-blue-300">
                Password: <span className="font-semibold">{newCredentials.password}</span>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(newCredentials.password)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
            Share these with the employee — they can sign in at /auth/login and will be taken straight to their {newCredentials.role} dashboard.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={String(employees.length)} icon={UsersIcon} hint={`${departments.length} departments`} />
        <StatCard label="Active" value={String(activeCount)} trend="up" delta="On duty" />
        <StatCard label="On leave / suspended" value={String(notActiveCount)} trend="down" delta="Review needed" />
        <StatCard
          label="Total monthly salaries"
          value={formatCurrency(employees.reduce((sum, e) => sum + e.salary, 0))}
        />
      </div>

      <SectionCard
        title="All employees"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("company-employees", filtered.map((e) => ({
                ID: e.id,
                Name: e.name,
                Title: e.title,
                Department: e.department,
                "Assigned Pump": e.assignedPump,
                Shift: e.shift,
                Phone: e.phone,
                Status: e.status,
                "Salary (Rs.)": e.salary,
                "Join Date": e.joinDate,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, title or ID…" />
          <FilterSelect value={department} onChange={setDepartment} options={departments} label="Department" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Assigned pump</th>
                <th className="px-5 py-3 font-medium">Shift</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Salary</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{e.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{e.title} · {e.id}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.department}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.assignedPump}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.shift}</td>
                  <td className="px-5 py-3">
                    <Badge>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(e.salary)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      aria-label={`Edit ${e.name}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <EditIcon className="size-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No employees match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {employees.length} employees
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Employee" : "Add Employee"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bilal Aslam"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Role</label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleSlug }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="" disabled>Select role…</option>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Job title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={form.role ? getRoleBySlug(form.role).label : "e.g. Pump Attendant"}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            {!editingId && form.name.trim() && form.role && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Auto-Generated Email:</p>
                <p className="mt-1 font-mono text-sm text-blue-800 dark:text-blue-300">
                  {generateEmployeeEmail(form.name.trim(), form.role) || "—"}
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                  A password will be generated automatically on submit.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Assigned pump</label>
                <input
                  value={form.assignedPump}
                  onChange={(e) => setForm((f) => ({ ...f, assignedPump: e.target.value }))}
                  placeholder="e.g. Pump 2"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+92 3xx xxx xxxx"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Shift</label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as Employee["shift"] }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EmployeeStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly salary (Rs.)</label>
              <input
                type="number"
                min={0}
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. 45000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {submitting ? "Adding…" : editingId ? "Save Changes" : "Add Employee"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
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

// Roles that operate at one specific pump — meter readings, dispensing,
// day-to-day on-site oversight — so creating one of these needs a real
// pumpId, not just a free-text label.
const PUMP_SCOPED_ROLES = new Set(["pump-attendant", "cashier", "pump-manager", "maintenance-technician"]);

type EmployeeFormState = {
  name: string;
  title: string;
  role: RoleSlug | "";
  assignedPump: string;
  pumpId: string;
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
    pumpId: "",
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
    pumpId: "",
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

// Map a MongoDB employee record onto the shape this page renders. Same
// pattern as the Add Pump page's fromRecord: the password isn't in the
// record (only its hash is stored), so it's read from the passwords map
// this page keeps in memory from creation time.
function fromRecord(r: any, passwords: Record<string, string>): Employee {
  const roleLabel = getRoleBySlug(r.role).label;
  return {
    id: r._id,
    name: r.name,
    title: roleLabel,
    department: roleLabel,
    role: r.role,
    email: r.email,
    password: passwords[r._id] ?? "",
    lastLogin: r.lastLogin ? String(r.lastLogin) : undefined,
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
  const [selected, setSelected] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  // Passwords the admin generated in this session (only the hash is stored
  // in MongoDB) — same pattern as the Add Pump page's knownPasswords.
  const [knownPasswords, setKnownPasswords] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pumps, setPumps] = useState<{ id: string; name: string }[]>([]);

  // Employees live in MongoDB (single source of truth) — load whatever
  // Admin/HR has already created via this page.
  async function loadEmployees(passwords: Record<string, string> = knownPasswords) {
    try {
      const res = await fetch("/api/admin/employees", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employees");
      setEmployees((data.employees ?? []).map((r: any) => fromRecord(r, passwords)));
    } catch (err) {
      console.error("[Employees] load failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load employees");
    }
  }

  // Pump-scoped roles (attendant, cashier, pump-manager, maintenance) need a
  // real pump assigned — fetched once for the create form's dropdown.
  useEffect(() => {
    fetch("/api/admin/pumps", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPumps((data.pumps ?? []).map((p: any) => ({ id: p._id, name: p.name })));
        }
      })
      .catch((err) => console.error("[Employees] pump list load failed:", err));
  }, []);

  useEffect(() => {
    loadEmployees();
  }, []);

  // Fetch the selected employee's own attendance history — keyed on their
  // id, so switching between employees never shows a stale/other
  // employee's records (see GET /api/admin/attendance?employeeId=...).
  useEffect(() => {
    if (!selected) {
      setAttendance([]);
      return;
    }
    let cancelled = false;
    setAttendanceLoading(true);
    fetch(`/api/admin/attendance?employeeId=${encodeURIComponent(selected.id)}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAttendance(data.attendance ?? []);
      })
      .catch((err) => {
        console.error("[Employees] attendance load failed:", err);
        if (!cancelled) setAttendance([]);
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

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
    if (PUMP_SCOPED_ROLES.has(form.role) && !form.pumpId) {
      setError("This role works at a specific pump — please assign one");
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
      pumpId: form.pumpId || undefined,
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

      const passwords = { ...knownPasswords, [data.employee._id]: generatedPassword };
      setKnownPasswords(passwords);
      setShowAdd(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadEmployees(passwords);
    } catch (err) {
      console.error("[Employees] create failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    if (!window.confirm(`Delete ${employee.name}? Their login will stop working.`)) return;
    const res = await fetch(`/api/admin/employees?employeeId=${encodeURIComponent(employee.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete employee");
      return;
    }
    setSelected(null);
    await loadEmployees();
  }

  // Reset an employee's login password — same flow as the Add Pump page's
  // handleResetPassword: PUT the new password, then remember it locally so
  // it becomes viewable again (only the hash is ever stored in MongoDB).
  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    const newPassword = resetPasswordValue.trim();
    if (!newPassword || !selected) return;

    const res = await fetch("/api/admin/employees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ employeeId: selected.id, password: newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to reset password");
      return;
    }

    const passwords = { ...knownPasswords, [selected.id]: newPassword };
    setKnownPasswords(passwords);
    setSelected({ ...selected, password: newPassword });
    setResetPasswordValue("");
    setShowResetForm(false);
    await loadEmployees(passwords);
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
                <tr
                  key={e.id}
                  onClick={() => {
                    setSelected(e);
                    setShowPassword(false);
                    setShowResetForm(false);
                  }}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
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
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(e);
                      }}
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
          Showing {filtered.length} of {employees.length} employees · click a row for login credentials
        </p>
      </SectionCard>

      {selected && (
        <Modal
          title={selected.name}
          subtitle={getRoleBySlug(selected.role).label}
          onClose={() => {
            setSelected(null);
            setShowPassword(false);
            setShowResetForm(false);
            setResetPasswordValue("");
          }}
        >
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Login Credentials</p>
            <div className="mt-2 space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <div className="text-blue-800 dark:text-blue-300">
                  Email: <span className="font-semibold">{selected.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selected.email || "")}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-blue-800 dark:text-blue-300">
                  Password: <span className="font-semibold">{showPassword ? selected.password || "(not viewable — use Reset Password)" : "••••••••"}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(selected.password || "")}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowResetForm(!showResetForm)}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showResetForm ? "Cancel Reset" : "Reset Password"}
            </button>

            {showResetForm && (
              <form onSubmit={handleResetPassword} className="mt-3 space-y-2 border-t border-blue-200 pt-3 dark:border-blue-900">
                <div>
                  <input
                    type="text"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-xs dark:border-blue-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDeleteEmployee(selected)}
            className="mb-4 w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Delete Employee and Login
          </button>
          <DetailRow label="Role" value={getRoleBySlug(selected.role).label} />
          <DetailRow label="Email" value={selected.email} />
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
          <DetailRow label="Join date" value={selected.joinDate} />
          <DetailRow
            label="Last login"
            value={selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : "Never logged in yet"}
          />

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Attendance History</p>
            {attendanceLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                Loading…
              </div>
            ) : attendance.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                No attendance records yet.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Login</th>
                      <th className="px-3 py-2 font-medium">Logout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {attendance.map((a) => (
                      <tr key={a._id}>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{a.date}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                          {a.loginAt ? new Date(a.loginAt).toLocaleTimeString() : "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                          {a.logoutAt ? new Date(a.logoutAt).toLocaleTimeString() : "Still active"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Assigned pump{form.role && PUMP_SCOPED_ROLES.has(form.role) ? " *" : ""}
                </label>
                {form.role && PUMP_SCOPED_ROLES.has(form.role) ? (
                  <select
                    required
                    value={form.pumpId}
                    onChange={(e) => {
                      const pump = pumps.find((p) => p.id === e.target.value);
                      setForm((f) => ({ ...f, pumpId: e.target.value, assignedPump: pump?.name ?? "" }));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="" disabled>Select pump…</option>
                    {pumps.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.assignedPump}
                    onChange={(e) => setForm((f) => ({ ...f, assignedPump: e.target.value }))}
                    placeholder="e.g. Pump 2"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                )}
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

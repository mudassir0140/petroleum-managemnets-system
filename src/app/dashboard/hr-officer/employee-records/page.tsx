"use client";

import { useMemo, useState } from "react";
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

const STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Suspended"];
const SHIFTS: Employee["shift"][] = ["Morning", "Afternoon", "Night"];

type EmployeeFormState = {
  name: string;
  title: string;
  department: string;
  assignedPump: string;
  shift: Employee["shift"];
  phone: string;
  status: EmployeeStatus;
  salary: string;
};

function emptyForm(): EmployeeFormState {
  return {
    name: "",
    title: "",
    department: "Operations",
    assignedPump: "",
    shift: "Morning",
    phone: "",
    status: "Active",
    salary: "",
  };
}

function formFromEmployee(employee: Employee): EmployeeFormState {
  return {
    name: employee.name,
    title: employee.title,
    department: employee.department,
    assignedPump: employee.assignedPump,
    shift: employee.shift,
    phone: employee.phone,
    status: employee.status,
    salary: String(employee.salary),
  };
}

export default function HrOfficerEmployeeRecordsPage() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm());

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
    setShowForm(true);
  }

  function openEdit(employee: Employee) {
    setForm(formFromEmployee(employee));
    setEditingId(employee.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.title.trim()) return;
    const salary = Number(form.salary) || 0;

    if (editingId) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                name: form.name.trim(),
                title: form.title.trim(),
                department: form.department,
                assignedPump: form.assignedPump.trim() || e.assignedPump,
                shift: form.shift,
                phone: form.phone.trim() || e.phone,
                status: form.status,
                salary,
              }
            : e,
        ),
      );
    } else {
      const nextNumber = employees.length + 1;
      const newEmployee: Employee = {
        id: `EMP-${String(nextNumber).padStart(2, "0")}`,
        name: form.name.trim(),
        title: form.title.trim(),
        department: form.department,
        assignedPump: form.assignedPump.trim() || "—",
        shift: form.shift,
        weeklyOff: "Sunday",
        phone: form.phone.trim() || "—",
        status: form.status,
        salary,
        attendanceRate: 100,
        joinDate: new Date().toISOString().slice(0, 10),
        week: ["P", "P", "P", "P", "P", "P", "P"],
      };
      setEmployees((prev) => [...prev, newEmployee]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        description="Full staff directory — job title, department, contact and status."
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
        title="All employee records"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("employee-records", filtered.map((e) => ({
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

      {showForm && (
        <Modal title={editingId ? "Edit Employee" : "Add Employee"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Job title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Pump Attendant"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Department</label>
                <input
                  required
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Operations"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Assigned pump</label>
                <input
                  value={form.assignedPump}
                  onChange={(e) => setForm((f) => ({ ...f, assignedPump: e.target.value }))}
                  placeholder="e.g. Pump 2"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+92 3xx xxx xxxx"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly salary (Rs.)</label>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.salary}
                  onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                  placeholder="e.g. 45000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Employee"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

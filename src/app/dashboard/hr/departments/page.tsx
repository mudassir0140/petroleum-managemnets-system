// @ts-nocheck
"use client";

import { useState } from "react";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, FactoryIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/dashboard/format";
import { EMPLOYEES } from "@/lib/dashboard/data/employees";
import {
  DEPARTMENTS,
  departmentEmployeeCount,
  departmentMonthlySalaries,
  type Department,
} from "@/lib/dashboard/data/departments";

type DeptFormState = { name: string; head: string; description: string; monthlyBudget: string };

function emptyForm(): DeptFormState {
  return { name: "", head: "", description: "", monthlyBudget: "" };
}

function formFromDept(dept: Department): DeptFormState {
  return {
    name: dept.name,
    head: dept.head,
    description: dept.description,
    monthlyBudget: String(dept.monthlyBudget),
  };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptFormState>(emptyForm());

  const totalBudget = departments.reduce((sum, d) => sum + d.monthlyBudget, 0);
  const totalSalaries = departments.reduce((sum, d) => sum + departmentMonthlySalaries(d.name), 0);

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(dept: Department) {
    setForm(formFromDept(dept));
    setEditingId(dept.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.head.trim()) return;
    const monthlyBudget = Number(form.monthlyBudget) || 0;

    if (editingId) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? { ...d, name: form.name.trim(), head: form.head.trim(), description: form.description.trim(), monthlyBudget }
            : d,
        ),
      );
    } else {
      const newDept: Department = {
        id: `DEPT-${String(departments.length + 1).padStart(2, "0")}`,
        name: form.name.trim(),
        head: form.head.trim(),
        description: form.description.trim() || "—",
        monthlyBudget,
      };
      setDepartments((prev) => [...prev, newDept]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Every department, its head and monthly budget."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add Department
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Departments" value={String(departments.length)} icon={FactoryIcon} />
        <StatCard label="Total employees" value={String(EMPLOYEES.length)} icon={UsersIcon} />
        <StatCard label="Total monthly budget" value={formatCurrency(totalBudget)} />
        <StatCard label="Total monthly salaries" value={formatCurrency(totalSalaries)} hint="vs. budget" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((dept) => {
          const count = departmentEmployeeCount(dept.name);
          const salaries = departmentMonthlySalaries(dept.name);
          const utilisation = dept.monthlyBudget === 0 ? 0 : Math.min(100, Math.round((salaries / dept.monthlyBudget) * 100));
          return (
            <SectionCard key={dept.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Head: {dept.head}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(dept)}
                    aria-label={`Edit ${dept.name}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <EditIcon className="size-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dept.description}</p>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{count} employee{count === 1 ? "" : "s"}</span>
                  <span>{formatCurrency(salaries)} / {formatCurrency(dept.monthlyBudget)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${utilisation > 90 ? "bg-rose-500" : "bg-amber-500"}`}
                    style={{ width: `${utilisation}%` }}
                  />
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      {showAdd && (
        <Modal title={editingId ? "Edit Department" : "Add Department"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Department name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Marketing"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Department head</label>
              <input
                required
                value={form.head}
                onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))}
                placeholder="e.g. Sana Malik"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What this department is responsible for"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Monthly budget (Rs.)</label>
              <input
                required
                type="number"
                min={0}
                value={form.monthlyBudget}
                onChange={(e) => setForm((f) => ({ ...f, monthlyBudget: e.target.value }))}
                placeholder="e.g. 200000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Department"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

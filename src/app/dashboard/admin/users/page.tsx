// @ts-nocheck
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
import { ROLES } from "@/lib/roles";
import { SYSTEM_USERS, type SystemUser, type UserStatus } from "@/lib/dashboard/data/system-users";

const STATUSES: UserStatus[] = ["Active", "Disabled", "Locked"];

type UserFormState = { name: string; email: string; roleLabel: string; status: UserStatus };

function emptyForm(): UserFormState {
  return { name: "", email: "", roleLabel: ROLES[0]?.label ?? "", status: "Active" };
}

function formFromUser(user: SystemUser): UserFormState {
  return { name: user.name, email: user.email, roleLabel: user.roleLabel, status: user.status };
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(SYSTEM_USERS);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());

  const roleLabels = Array.from(new Set(users.map((u) => u.roleLabel)));

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "All" || u.roleLabel === role;
      const matchesStatus = status === "All" || u.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const activeCount = users.filter((u) => u.status === "Active").length;
  const disabledCount = users.filter((u) => u.status === "Disabled").length;
  const lockedCount = users.filter((u) => u.status === "Locked").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(user: SystemUser) {
    setForm(formFromUser(user));
    setEditingId(user.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    if (editingId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? { ...u, name: form.name.trim(), email: form.email.trim(), roleLabel: form.roleLabel, status: form.status }
            : u,
        ),
      );
    } else {
      const newUser: SystemUser = {
        id: `USR-${String(users.length + 1).padStart(2, "0")}`,
        name: form.name.trim(),
        email: form.email.trim(),
        roleLabel: form.roleLabel,
        status: form.status,
        lastLogin: "Never",
        createdOn: new Date().toISOString().slice(0, 10),
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Users"
        description="Every account with dashboard access, across every role."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add User
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={String(users.length)} icon={UsersIcon} hint={`${roleLabels.length} roles`} />
        <StatCard label="Active" value={String(activeCount)} trend="up" delta="Can sign in" />
        <StatCard label="Disabled" value={String(disabledCount)} trend="down" delta="Access removed" />
        <StatCard label="Locked" value={String(lockedCount)} trend="down" delta="Needs unlock" />
      </div>

      <SectionCard
        title="All system users"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("system-users", filtered.map((u) => ({
                ID: u.id,
                Name: u.name,
                Email: u.email,
                Role: u.roleLabel,
                Status: u.status,
                "Last Login": u.lastLogin,
                "Created On": u.createdOn,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
          <FilterSelect value={role} onChange={setRole} options={roleLabels} label="Role" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.roleLabel}</td>
                  <td className="px-5 py-3">
                    <Badge>{u.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.lastLogin}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      aria-label={`Edit ${u.name}`}
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
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {users.length} users
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit User" : "Add User"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Farah Iqbal"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@petromanage.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Role</label>
                <select
                  value={form.roleLabel}
                  onChange={(e) => setForm((f) => ({ ...f, roleLabel: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {ROLES.map((r) => (
                    <option key={r.slug} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add User"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { LockIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { AUDIT_LOG, SYSTEM_USERS, type SystemUser } from "@/lib/dashboard/data/system-users";

const ACTIONS = ["Login", "Logout", "Password Reset", "Role Changed", "Account Disabled", "Account Enabled"];

export default function UserAccessPage() {
  const [users, setUsers] = useState<SystemUser[]>(SYSTEM_USERS);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [resetting, setResetting] = useState<SystemUser | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const filteredAudit = useMemo(() => {
    return AUDIT_LOG.filter((entry) => {
      const matchesSearch = entry.userName.toLowerCase().includes(search.toLowerCase());
      const matchesAction = actionFilter === "All" || entry.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [search, actionFilter]);

  const activeCount = users.filter((u) => u.status === "Active").length;
  const lockedCount = users.filter((u) => u.status === "Locked").length;

  function toggleAccess(user: SystemUser) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, status: u.status === "Disabled" ? "Active" : "Disabled" } : u,
      ),
    );
  }

  function unlockUser(user: SystemUser) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "Active" } : u)));
  }

  function confirmReset(event: React.FormEvent) {
    event.preventDefault();
    if (!resetting) return;
    setConfirmMessage(`Password reset link sent to ${resetting.email}`);
    setResetting(null);
    setTimeout(() => setConfirmMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Access"
        description="Enable, disable, unlock and audit access for every system user."
      />

      {confirmMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          {confirmMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users with access" value={String(activeCount)} icon={LockIcon} />
        <StatCard label="Locked accounts" value={String(lockedCount)} trend={lockedCount > 0 ? "down" : "up"} delta={lockedCount > 0 ? "Needs unlock" : "None locked"} />
        <StatCard label="Total accounts" value={String(users.length)} />
        <StatCard label="Audit entries" value={String(AUDIT_LOG.length)} />
      </div>

      <SectionCard title="Access control" description="Toggle access or unlock an account">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.roleLabel}</td>
                  <td className="px-5 py-3">
                    <Badge>{u.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {u.status === "Locked" && (
                        <button
                          type="button"
                          onClick={() => unlockUser(u)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
                        >
                          Unlock
                        </button>
                      )}
                      {u.status !== "Locked" && (
                        <button
                          type="button"
                          onClick={() => toggleAccess(u)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {u.status === "Active" ? "Disable" : "Enable"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setResetting(u)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Access audit log"
        description="Recent logins, logouts and account changes"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("access-audit-log", filteredAudit.map((entry) => ({
                ID: entry.id,
                User: entry.userName,
                Action: entry.action,
                Device: entry.device,
                IP: entry.ip,
                Time: entry.time,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search user…" />
          <FilterSelect value={actionFilter} onChange={setActionFilter} options={ACTIONS} label="Action" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">IP address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAudit.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{entry.time}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{entry.userName}</td>
                  <td className="px-5 py-3">
                    <Badge>{entry.action}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{entry.device}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{entry.ip}</td>
                </tr>
              ))}
              {filteredAudit.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No audit entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {resetting && (
        <Modal title={`Reset password — ${resetting.name}`} subtitle={resetting.email} onClose={() => setResetting(null)}>
          <form className="space-y-4" onSubmit={confirmReset}>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will email a password reset link to <strong>{resetting.email}</strong>. The user will need to set a new password before their next login.
            </p>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Send Reset Link
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

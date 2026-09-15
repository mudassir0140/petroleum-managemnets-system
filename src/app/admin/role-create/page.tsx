"use client";

import { useState, useEffect } from "react";
import { XCircleIcon, CheckCircleIcon, XIcon, EditIcon } from "@/components/icons";
import {
  adminCreateUser,
  adminGetAllUsers,
  adminDeleteUser,
  adminDisableUser,
  adminEnableUser,
} from "@/lib/user/actions";
import { getCompanyRoles } from "@/lib/roles";
import type { UserAccount } from "@/lib/user/types";

export default function RoleCreatePage() {
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("company-manager");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
    setCompanyRoles(getCompanyRoles());
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const result = await adminGetAllUsers();
      setUsers(result);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!name || !email || !password || !role) {
      setError("All fields are required");
      setSubmitting(false);
      return;
    }

    try {
      const result = await adminCreateUser(name, email, password, role, "admin");

      if (result.success) {
        setSuccess(`User ${email} created successfully as ${role}`);
        setName("");
        setEmail("");
        setPassword("");
        setRole("company-manager");
        await loadUsers();
      } else {
        setError(result.error || "Failed to create user");
      }
    } catch (err) {
      setError("An error occurred while creating the user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Are you sure you want to delete this user account?")) {
      return;
    }

    try {
      const result = await adminDeleteUser(userId);
      if (result.success) {
        setSuccess("User deleted successfully");
        await loadUsers();
      } else {
        setError(result.error || "Failed to delete user");
      }
    } catch (err) {
      setError("An error occurred while deleting the user");
    }
  }

  async function handleToggleDisable(user: UserAccount) {
    try {
      const result = user.enabled
        ? await adminDisableUser(user.id)
        : await adminEnableUser(user.id);

      if (result.success) {
        setSuccess(`User ${user.enabled ? "disabled" : "enabled"} successfully`);
        await loadUsers();
      } else {
        setError(result.error || "Failed to update user");
      }
    } catch (err) {
      setError("An error occurred");
    }
  }

  const getRoleLabelFromSlug = (slug: string) => {
    return companyRoles.find((r) => r.slug === slug)?.label || slug;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create Company Roles
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Create and manage company role user accounts
        </p>
      </div>

      {/* Create User Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          New User Account
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {companyRoles.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Created Users
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {users.length} user{users.length !== 1 ? "s" : ""} created
          </p>
        </div>

        {isLoading ? (
          <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-600 dark:text-slate-400">
            No users created yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                      {user.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                      {getRoleLabelFromSlug(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.enabled !== false
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {user.enabled !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleDisable(user)}
                          className={`rounded-lg p-1.5 transition ${
                            user.enabled !== false
                              ? "text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              : "text-slate-600 hover:bg-green-50 hover:text-green-600 dark:text-slate-400 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          }`}
                          title={
                            user.enabled !== false ? "Disable user" : "Enable user"
                          }
                        >
                          {user.enabled !== false ? (
                            <XIcon className="size-4" />
                          ) : (
                            <CheckCircleIcon className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="rounded-lg p-1.5 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete user"
                        >
                          <XCircleIcon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  email: string;
}

interface ProfileData {
  employee: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    pumpId: string;
    pumpName: string;
    status: string;
  };
  pumpEmployees: Employee[];
}

export default function DirectoryPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/employee/profile");
        if (!response.ok) throw new Error("Failed to fetch profile");

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return (
    <div>
      <BackButton />
      <PageHeader
        title="Staff Directory / عملے کی فہرست"
        description="Your profile and pump team members"
      />

      {loading ? (
        <Card>
          <div className="p-6 text-center text-ink-muted">Loading...</div>
        </Card>
      ) : error ? (
        <Card>
          <div className="p-6 text-center text-rose-600">{error}</div>
        </Card>
      ) : data ? (
        <>
          <Card className="mb-6">
            <CardHeader title="Your Profile / آپ کی پروفائل" />
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Name / نام</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{data.employee.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Email</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{data.employee.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Phone / فون</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{data.employee.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Role / کردار</label>
                  <p className="mt-1 text-sm font-medium capitalize text-ink-primary">{data.employee.role}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Pump / پمپ</label>
                  <p className="mt-1 text-sm font-medium text-ink-primary">{data.employee.pumpName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted uppercase">Status / حالت</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    data.employee.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}>
                    {data.employee.status}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={`Pump Team / پمپ کی ٹیم (${data.pumpEmployees.length})`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Name / نام</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Phone / فون</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Role / کردار</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-muted">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pumpEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                        No team members
                      </td>
                    </tr>
                  ) : (
                    data.pumpEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b border-border-subtle hover:bg-surface-2">
                        <td className="px-4 py-3 text-ink-primary font-medium">{employee.name}</td>
                        <td className="px-4 py-3 text-ink-primary">{employee.phone}</td>
                        <td className="px-4 py-3 text-ink-primary capitalize">{employee.role}</td>
                        <td className="px-4 py-3 text-ink-primary">{employee.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

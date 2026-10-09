// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { EditIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { Badge } from "@/components/dashboard/badge";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { StatCard } from "@/components/dashboard/stat-card";

interface PumpEmployee {
  _id: string;
  name: string;
  username: string;
  phone: string;
  role: string;
  shiftHours: number;
  createdAt: string;
  pumpId: string;
  pumpName: string;
  addedBy: string;
  addedByUrdu: string;
}

export default function PumpEmployeesPage() {
  const [employees, setEmployees] = useState<PumpEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPump, setSelectedPump] = useState("All");
  const [selected, setSelected] = useState<PumpEmployee | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pump-employees", { credentials: "include" });
      const data = await res.json();
      if (!Array.isArray(data)) {
        setError("Invalid response format");
        return;
      }
      setEmployees(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selected) {
      setAttendance([]);
      return;
    }
    let cancelled = false;
    setAttendanceLoading(true);
    fetch(`/api/admin/attendance?employeeId=${encodeURIComponent(selected.username)}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAttendance(data.attendance ?? []);
      })
      .catch((err) => {
        console.error("Failed to load attendance:", err);
        if (!cancelled) setAttendance([]);
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.username]);

  const pumps = useMemo(() => {
    return ["All", ...Array.from(new Set(employees.map((e) => e.pumpName)))];
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.username.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search);
      const matchesPump = selectedPump === "All" || e.pumpName === selectedPump;
      return matchesSearch && matchesPump;
    });
  }, [employees, search, selectedPump]);

  const pumpsCount = Array.from(new Set(employees.map((e) => e.pumpId))).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pump Employees / ٹینک کے ملازمین"
        description="View employees added by pump owners across all pumps"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Employees" value={employees.length.toString()} icon={UsersIcon} />
        <StatCard label="Pumps" value={pumpsCount.toString()} icon={UsersIcon} tone="amber" />
        <StatCard label="Average Shift Hours" value={employees.length > 0 ? (employees.reduce((sum, e) => sum + (e.shiftHours || 8), 0) / employees.length).toFixed(1) + "h" : "—"} icon={UsersIcon} tone="emerald" />
      </div>

      <SectionCard>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, username, or phone..."
          />
          <FilterSelect
            label="Pump"
            options={pumps}
            value={selectedPump}
            onChange={setSelectedPump}
          />
        </FilterBar>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">Loading employees...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">No employees found</p>
        </div>
      ) : (
        <SectionCard>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((emp) => (
              <div
                key={emp._id}
                onClick={() => setSelected(emp)}
                className="flex cursor-pointer items-center justify-between gap-4 p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">@{emp.username}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Badge label={emp.pumpName} size="sm" />
                    <Badge label={`${emp.shiftHours}h shift`} size="sm" tone="amber" />
                    <Badge label={emp.addedByUrdu} size="sm" tone="emerald" />
                  </div>
                </div>
                <EditIcon className="size-4 shrink-0 text-slate-400" />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {selected && (
        <Modal title={selected.name} subtitle={selected.pumpName} onClose={() => setSelected(null)}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Information</h3>
              <DetailRow label="Username" value={selected.username} />
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Role" value={selected.role} />
              <DetailRow label="Shift Hours" value={`${selected.shiftHours} hours`} />
              <DetailRow label="Added By" value={selected.addedBy} />
              <DetailRow label="Pump" value={selected.pumpName} />
              <DetailRow label="Date Added" value={new Date(selected.createdAt).toLocaleDateString()} />
            </div>

            {attendanceLoading ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading attendance...</p>
            ) : attendance.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Attendance</h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {attendance.slice(0, 5).map((record: any, idx) => (
                    <div key={idx} className="py-2 text-xs">
                      <p className="text-slate-900 dark:text-white">{record.date}</p>
                      <p className="text-slate-600 dark:text-slate-400">{record.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No attendance records</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

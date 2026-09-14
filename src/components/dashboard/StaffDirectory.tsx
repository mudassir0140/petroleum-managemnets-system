"use client";

import { useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_TONE } from "@/lib/status-maps";
import { titleCase } from "@/lib/format";
import type { AttendanceRecord, AttendanceStatus, StaffMember } from "@/lib/types";

const CYCLE: AttendanceStatus[] = ["present", "late", "absent", "leave"];

export function StaffDirectory({ staff, attendanceToday }: { staff: StaffMember[]; attendanceToday: AttendanceRecord[] }) {
  const [query, setQuery] = useState("");
  const [statusById, setStatusById] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(attendanceToday.map((a) => [a.staffId, a.status])),
  );

  function cycleStatus(staffId: string) {
    setStatusById((prev) => {
      const current = prev[staffId] ?? "present";
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return { ...prev, [staffId]: next };
    });
  }

  const filtered = staff.filter(
    (s) => !query.trim() || s.name.toLowerCase().includes(query.trim().toLowerCase()) || s.role.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const attendanceByStaff = Object.fromEntries(attendanceToday.map((a) => [a.staffId, a]));

  const columns: Column<StaffMember>[] = [
    {
      header: "Employee",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: row.photoColor }}
          >
            {row.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-ink-muted">{row.role}</p>
          </div>
        </div>
      ),
    },
    { header: "Shift", cell: (row) => `${titleCase(row.shift)}` },
    { header: "Phone", cell: (row) => row.phone },
    {
      header: "Check-in / out",
      cell: (row) => {
        const record = attendanceByStaff[row.id];
        if (!record?.checkIn) return <span className="text-ink-muted">—</span>;
        return (
          <span className="tabular-nums">
            {record.checkIn} – {record.checkOut}
          </span>
        );
      },
    },
    {
      header: "Today's status",
      cell: (row) => {
        const status = statusById[row.id] ?? "present";
        return (
          <button onClick={() => cycleStatus(row.id)} title="Click to update today's status" className="cursor-pointer">
            <Badge tone={ATTENDANCE_STATUS_TONE[status]}>{ATTENDANCE_STATUS_LABEL[status]}</Badge>
          </button>
        );
      },
    },
  ];

  const presentCount = Object.values(statusById).filter((s) => s === "present" || s === "late").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search employees…" className="max-w-xs" />
        <p className="text-xs text-ink-muted">
          <span className="font-semibold text-ink-primary">{presentCount}</span> / {staff.length} present today · click a status pill to update
        </p>
      </div>
      <Table columns={columns} rows={filtered} rowKey={(row) => row.id} />
    </div>
  );
}

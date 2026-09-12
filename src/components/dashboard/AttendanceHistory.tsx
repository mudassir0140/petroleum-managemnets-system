"use client";

import { useMemo, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Select } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_TONE } from "@/lib/status-maps";
import { formatDate } from "@/lib/format";
import type { AttendanceRecord, StaffMember } from "@/lib/types";

export function AttendanceHistory({ staff, history }: { staff: StaffMember[]; history: AttendanceRecord[] }) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");

  const rows = useMemo(
    () => history.filter((r) => r.staffId === staffId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [history, staffId],
  );

  const columns: Column<AttendanceRecord>[] = [
    { header: "Date", cell: (row) => formatDate(row.date) },
    { header: "Status", cell: (row) => <Badge tone={ATTENDANCE_STATUS_TONE[row.status]}>{ATTENDANCE_STATUS_LABEL[row.status]}</Badge> },
    { header: "Check-in", cell: (row) => row.checkIn ?? "—" },
    { header: "Check-out", cell: (row) => row.checkOut ?? "—" },
  ];

  return (
    <div>
      <div className="mb-4">
        <Select
          value={staffId}
          onChange={setStaffId}
          options={staff.map((s) => ({ label: `${s.name} — ${s.role}`, value: s.id }))}
          className="max-w-xs"
        />
      </div>
      <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  );
}

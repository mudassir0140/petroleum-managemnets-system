// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, MessageIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { PUMPS } from "@/lib/dashboard/data/pumps";
import {
  COORDINATION_ITEMS,
  type CoordinationItem,
  type CoordinationParty,
  type CoordinationStatus,
} from "@/lib/dashboard/data/area";

const PARTIES: CoordinationParty[] = ["Company Owner", "Pump Owner", "Area Manager"];
const STATUSES: CoordinationStatus[] = ["Open", "In Progress", "Resolved"];
const PUMP_OPTIONS = ["All Pumps", ...PUMPS.map((p) => p.name)];

const STATUS_TONE: Record<CoordinationStatus, BadgeTone> = {
  Open: "warning",
  "In Progress": "info",
  Resolved: "success",
};

type CoordFormState = {
  subject: string;
  from: CoordinationParty;
  to: CoordinationParty;
  pump: string;
  message: string;
  status: CoordinationStatus;
  date: string;
};

function pumpCity(pumpName: string) {
  return PUMPS.find((p) => p.name === pumpName)?.city ?? "All Cities";
}

function emptyForm(): CoordFormState {
  return {
    subject: "",
    from: "Area Manager",
    to: "Company Owner",
    pump: "All Pumps",
    message: "",
    status: "Open",
    date: new Date().toISOString().slice(0, 10),
  };
}

function formFromItem(item: CoordinationItem): CoordFormState {
  return {
    subject: item.subject,
    from: item.from,
    to: item.to,
    pump: item.pump,
    message: item.message,
    status: item.status,
    date: item.date,
  };
}

export default function CoordinationPage() {
  const [items, setItems] = useState<CoordinationItem[]>(COORDINATION_ITEMS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CoordFormState>(emptyForm());

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.subject.toLowerCase().includes(search.toLowerCase()) ||
        item.pump.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const openCount = items.filter((i) => i.status === "Open").length;
  const inProgressCount = items.filter((i) => i.status === "In Progress").length;
  const resolvedCount = items.filter((i) => i.status === "Resolved").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowAdd(true);
  }

  function openEdit(item: CoordinationItem) {
    setForm(formFromItem(item));
    setEditingId(item.id);
    setShowAdd(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    const city = pumpCity(form.pump);

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                subject: form.subject.trim(),
                from: form.from,
                to: form.to,
                pump: form.pump,
                city,
                message: form.message.trim(),
                status: form.status,
                date: form.date,
              }
            : item,
        ),
      );
    } else {
      const nextNumber = items.length + 101;
      const newItem: CoordinationItem = {
        id: `COORD-${nextNumber}`,
        subject: form.subject.trim(),
        from: form.from,
        to: form.to,
        pump: form.pump,
        city,
        message: form.message.trim(),
        status: form.status,
        date: form.date,
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coordination"
        description="Notes and requests between the Company Owner and Pump Owners in your area."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            New Coordination Note
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total items" value={String(items.length)} icon={MessageIcon} />
        <StatCard label="Open" value={String(openCount)} trend={openCount > 0 ? "down" : "up"} delta={openCount > 0 ? "Awaiting action" : "All clear"} />
        <StatCard label="In progress" value={String(inProgressCount)} icon={UsersIcon} />
        <StatCard label="Resolved" value={String(resolvedCount)} trend="up" delta="Closed out" />
      </div>

      <SectionCard
        title="Coordination log"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("coordination-log", filtered.map((item) => ({
                ID: item.id, Subject: item.subject, From: item.from, To: item.to,
                Pump: item.pump, City: item.city, Status: item.status, Date: item.date, Message: item.message,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search subject, pump or ID…" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{item.subject}</p>
                  <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {item.from} → {item.to} · {item.pump} · {item.city} · {item.date}
                </p>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(item)}
                aria-label={`Edit ${item.subject}`}
                className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <EditIcon className="size-3.5" />
                Edit
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No coordination items match these filters.
            </p>
          )}
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {items.length} items
        </p>
      </SectionCard>

      {showAdd && (
        <Modal title={editingId ? "Edit Coordination Note" : "New Coordination Note"} onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Approve price revision for Pump 4"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">From</label>
                <select
                  value={form.from}
                  onChange={(e) => setForm((f) => ({ ...f, from: e.target.value as CoordinationParty }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PARTIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">To</label>
                <select
                  value={form.to}
                  onChange={(e) => setForm((f) => ({ ...f, to: e.target.value as CoordinationParty }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PARTIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump</label>
                <select
                  value={form.pump}
                  onChange={(e) => setForm((f) => ({ ...f, pump: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PUMP_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CoordinationStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Message</label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="What needs to be coordinated?"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Add Note"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

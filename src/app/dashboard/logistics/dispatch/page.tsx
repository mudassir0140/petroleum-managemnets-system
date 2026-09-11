"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EditIcon, PlusIcon, SendIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import {
  DISPATCH_ORDERS,
  type DispatchOrder,
  type DispatchPriority,
  type DispatchStatus,
} from "@/lib/dashboard/data/dispatch";
import { DRIVERS } from "@/lib/dashboard/data/drivers";
import { ROUTES } from "@/lib/dashboard/data/routes";
import { TANKERS } from "@/lib/dashboard/data/tankers";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

const STATUSES: DispatchStatus[] = ["Scheduled", "Dispatched", "In Transit", "Completed", "Cancelled"];
const PRIORITIES: DispatchPriority[] = ["Normal", "High", "Urgent"];

const PRIORITY_TONE: Record<DispatchPriority, "neutral" | "warning" | "danger"> = {
  Normal: "neutral",
  High: "warning",
  Urgent: "danger",
};

type DispatchFormState = {
  tanker: string;
  driver: string;
  routeId: string;
  fuelType: FuelType;
  quantity: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: DispatchPriority;
  status: DispatchStatus;
  notes: string;
};

function emptyForm(): DispatchFormState {
  return {
    tanker: TANKERS[0]?.id ?? "",
    driver: DRIVERS[0]?.name ?? "",
    routeId: ROUTES[0]?.id ?? "",
    fuelType: "petrol",
    quantity: "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "06:00 AM",
    priority: "Normal",
    status: "Scheduled",
    notes: "",
  };
}

function formFromOrder(order: DispatchOrder): DispatchFormState {
  return {
    tanker: order.tanker,
    driver: order.driver,
    routeId: order.routeId,
    fuelType: order.fuelType,
    quantity: String(order.quantity),
    scheduledDate: order.scheduledDate,
    scheduledTime: order.scheduledTime,
    priority: order.priority,
    status: order.status,
    notes: order.notes,
  };
}

function routeLabel(routeId: string) {
  const route = ROUTES.find((r) => r.id === routeId);
  return route ? `${route.from} → ${route.to}` : routeId;
}

export default function LogisticsDispatchPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>(DISPATCH_ORDERS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DispatchFormState>(emptyForm());

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.tanker.toLowerCase().includes(search.toLowerCase()) ||
        o.driver.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "All" || o.status === status;
      const matchesPriority = priority === "All" || o.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, search, status, priority]);

  const inTransit = orders.filter((o) => o.status === "In Transit" || o.status === "Dispatched").length;
  const scheduled = orders.filter((o) => o.status === "Scheduled").length;
  const urgent = orders.filter((o) => o.priority === "Urgent" && o.status !== "Completed" && o.status !== "Cancelled").length;
  const completed = orders.filter((o) => o.status === "Completed").length;

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(order: DispatchOrder) {
    setForm(formFromOrder(order));
    setEditingId(order.id);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const quantity = Number(form.quantity) || 0;
    if (quantity <= 0) return;

    if (editingId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingId
            ? {
                ...o,
                tanker: form.tanker,
                driver: form.driver,
                routeId: form.routeId,
                fuelType: form.fuelType,
                quantity,
                scheduledDate: form.scheduledDate,
                scheduledTime: form.scheduledTime,
                priority: form.priority,
                status: form.status,
                notes: form.notes.trim(),
              }
            : o,
        ),
      );
    } else {
      const newOrder: DispatchOrder = {
        id: `DSP-${3000 + orders.length + 1}`,
        tanker: form.tanker,
        driver: form.driver,
        routeId: form.routeId,
        fuelType: form.fuelType,
        quantity,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        priority: form.priority,
        status: form.status,
        notes: form.notes.trim(),
      };
      setOrders((prev) => [newOrder, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch"
        description="Schedule and track dispatch orders — tanker, driver and route assignment."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            New Dispatch
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(orders.length)} icon={SendIcon} />
        <StatCard label="Scheduled" value={String(scheduled)} />
        <StatCard label="Dispatched / in transit" value={String(inTransit)} trend="up" delta="Live" />
        <StatCard label="Urgent pending" value={String(urgent)} trend={urgent > 0 ? "down" : "up"} delta={urgent > 0 ? "Needs attention" : "All clear"} />
      </div>

      <SectionCard
        title="Dispatch board"
        description={`${completed} completed to date`}
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("dispatch-orders", filtered.map((o) => ({
                ID: o.id,
                Tanker: o.tanker,
                Driver: o.driver,
                Route: routeLabel(o.routeId),
                "Fuel Type": FUEL_TYPE_LABELS[o.fuelType],
                "Quantity (L)": o.quantity,
                "Scheduled Date": o.scheduledDate,
                "Scheduled Time": o.scheduledTime,
                Priority: o.priority,
                Status: o.status,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search dispatch ID, tanker or driver…" />
          <FilterSelect value={priority} onChange={setPriority} options={PRIORITIES} label="Priority" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Dispatch</th>
                <th className="px-5 py-3 font-medium">Tanker / Driver</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{o.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    <p>{o.tanker}</p>
                    <p className="text-xs text-slate-400">{o.driver}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{routeLabel(o.routeId)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {o.quantity.toLocaleString()} L
                    <span className="block text-xs text-slate-400">{FUEL_TYPE_LABELS[o.fuelType]}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{o.scheduledDate} · {o.scheduledTime}</td>
                  <td className="px-5 py-3">
                    <Badge tone={PRIORITY_TONE[o.priority]}>{o.priority}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(o)}
                      aria-label={`Edit ${o.id}`}
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
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No dispatch orders match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {orders.length} dispatch orders
        </p>
      </SectionCard>

      {showForm && (
        <Modal title={editingId ? "Edit Dispatch Order" : "New Dispatch Order"} onClose={() => setShowForm(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Tanker</label>
                <select
                  value={form.tanker}
                  onChange={(e) => setForm((f) => ({ ...f, tanker: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {TANKERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Driver</label>
                <select
                  value={form.driver}
                  onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {DRIVERS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Route</label>
              <select
                value={form.routeId}
                onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Fuel type</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Quantity (L)</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. 15000"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Scheduled date</label>
                <input
                  required
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Scheduled time</label>
                <input
                  required
                  value={form.scheduledTime}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                  placeholder="e.g. 06:00 AM"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as DispatchPriority }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DispatchStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional dispatch notes…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {editingId ? "Save Changes" : "Create Dispatch Order"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/dashboard/badge";
import { FilterBar, FilterSelect, SearchInput } from "@/components/dashboard/filter-controls";
import { DetailRow, Modal } from "@/components/dashboard/modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ExportButton, SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GaugeIcon, PlusIcon } from "@/components/icons";
import { downloadCsv } from "@/lib/dashboard/export-csv";
import { formatCurrency, formatLiters } from "@/lib/dashboard/format";
import {
  PUMPS,
  pumpTodayLiters,
  pumpTodayRevenue,
  pumpWeeklyTotal,
  type Pump,
  type PumpStatus,
} from "@/lib/dashboard/data/pumps";
import { CITIES, CITY_COORDS, FUEL_TYPE_LABELS } from "@/lib/dashboard/data/stations";

const STATUSES: PumpStatus[] = ["Online", "Offline", "Maintenance"];

type PumpFormState = { name: string; owner: string; ownerEmail: string; city: string; address: string; phone: string };

function emptyForm(): PumpFormState {
  return { name: "", owner: "", ownerEmail: "", city: CITIES[0], address: "", phone: "" };
}

export default function PumpsPage() {
  const [pumps, setPumps] = useState<Pump[]>(PUMPS);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Pump | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    return pumps.filter((pump) => {
      const matchesSearch =
        pump.name.toLowerCase().includes(search.toLowerCase()) ||
        pump.owner.toLowerCase().includes(search.toLowerCase()) ||
        String(pump.number).includes(search);
      const matchesCity = city === "All" || pump.city === city;
      const matchesStatus = status === "All" || pump.status === status;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [pumps, search, city, status]);

  const onlineCount = pumps.filter((p) => p.status === "Online").length;
  const totalRevenueToday = pumps.reduce((sum, p) => sum + pumpTodayRevenue(p), 0);
  const totalLitersToday = pumps.reduce((sum, p) => sum + pumpTodayLiters(p), 0);
  const maxWeekly = Math.max(...pumps.map(pumpWeeklyTotal), 1);

  function handleAddPump(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.owner.trim() || !form.ownerEmail.trim()) return;
    const nextNumber = Math.max(...pumps.map((p) => p.number)) + 1;
    const cityCoords =
      CITY_COORDS[form.city as (typeof CITIES)[number]] ?? CITY_COORDS[CITIES[0]];
    const newPump: Pump = {
      id: `PUMP-${String(nextNumber).padStart(2, "0")}`,
      number: nextNumber,
      name: form.name.trim(),
      owner: form.owner.trim(),
      ownerEmail: form.ownerEmail.trim(),
      city: form.city,
      address: form.address.trim() || `${form.city}`,
      lat: cityCoords.lat,
      lng: cityCoords.lng,
      phone: form.phone.trim() || "—",
      status: "Online",
      since: new Date().toISOString().slice(0, 10),
      lastInspection: new Date().toISOString().slice(0, 10),
      todaySales: [
        { fuelType: "petrol", liters: 0, revenue: 0 },
        { fuelType: "diesel", liters: 0, revenue: 0 },
      ],
      weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
      monthlySales: 0,
      lastMonthSales: 0,
    };
    setPumps((prev) => [...prev, newPump]);
    setForm(emptyForm());
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pumps"
        description="Every pump in the network — status, ownership, sales and performance."
        actions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add New Pump
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total pumps" value={String(pumps.length)} icon={GaugeIcon} hint="across 6 cities" />
        <StatCard label="Online" value={String(onlineCount)} trend="up" delta={`${pumps.length - onlineCount} down`} />
        <StatCard label="Revenue today" value={formatCurrency(totalRevenueToday)} trend="up" delta="+3.8%" hint="vs. yesterday" />
        <StatCard label="Liters dispensed today" value={formatLiters(totalLitersToday)} hint="all fuel types" />
      </div>

      <SectionCard title="Pump comparison" description="Weekly revenue, highest to lowest">
        <div className="space-y-3 p-5">
          {pumps
            .slice()
            .sort((a, b) => pumpWeeklyTotal(b) - pumpWeeklyTotal(a))
            .map((pump) => (
              <div key={pump.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Pump {pump.number} — {pump.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatCurrency(pumpWeeklyTotal(pump))}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(pumpWeeklyTotal(pump) / maxWeekly) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </SectionCard>

      <SectionCard
        title="All pumps"
        actions={
          <ExportButton
            onClick={() =>
              downloadCsv("pumps", filtered.map((p) => ({
                Pump: `Pump ${p.number}`,
                Name: p.name,
                Owner: p.owner,
                "Owner Email": p.ownerEmail,
                City: p.city,
                "Contact Number": p.phone,
                Status: p.status,
                "Today Liters": pumpTodayLiters(p),
                "Today Revenue (Rs.)": pumpTodayRevenue(p),
                "This Month (Rs.)": p.monthlySales,
                "Last Month (Rs.)": p.lastMonthSales,
              })))
            }
          />
        }
      >
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search pump number, name or owner…" />
          <FilterSelect value={city} onChange={setCity} options={CITIES} label="City" />
          <FilterSelect value={status} onChange={setStatus} options={STATUSES} label="Status" />
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Pump</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Today (L)</th>
                <th className="px-5 py-3 font-medium">Today revenue</th>
                <th className="px-5 py-3 font-medium">This month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((pump) => (
                <tr
                  key={pump.id}
                  onClick={() => setSelected(pump)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">Pump {pump.number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{pump.name}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{pump.owner}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">{pump.ownerEmail}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{pump.city}</td>
                  <td className="px-5 py-3">
                    <Badge>{pump.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{pumpTodayLiters(pump).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{formatCurrency(pumpTodayRevenue(pump))}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatCurrency(pump.monthlySales)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No pumps match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Showing {filtered.length} of {pumps.length} pumps · click a row for full details
        </p>
      </SectionCard>

      {selected && (
        <Modal
          title={`Pump ${selected.number} — ${selected.name}`}
          subtitle={`${selected.address}`}
          onClose={() => setSelected(null)}
        >
          <DetailRow label="Owner" value={selected.owner} />
          <DetailRow label="Owner Email" value={selected.ownerEmail} />
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="City" value={selected.city} />
          <DetailRow label="Status" value={<Badge>{selected.status}</Badge>} />
          <DetailRow label="Operating since" value={selected.since} />
          <DetailRow label="Last inspection" value={selected.lastInspection} />
          {selected.todaySales.map((sale) => (
            <DetailRow
              key={sale.fuelType}
              label={`${FUEL_TYPE_LABELS[sale.fuelType]} sold today`}
              value={`${sale.liters.toLocaleString()} L (${formatCurrency(sale.revenue)})`}
            />
          ))}
          <DetailRow label="This week" value={formatCurrency(pumpWeeklyTotal(selected))} />
          <DetailRow label="This month" value={formatCurrency(selected.monthlySales)} />
          <DetailRow label="Last month" value={formatCurrency(selected.lastMonthSales)} />
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add New Pump" onClose={() => setShowAdd(false)}>
          <form className="space-y-4" onSubmit={handleAddPump}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. City Fuel Station"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Owner name</label>
              <input
                required
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                placeholder="e.g. Ali Traders"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Owner email</label>
              <input
                required
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                placeholder="e.g. owner@company.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">City</label>
              <select
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, area"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+92 3xx xxx xxxx"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              Add Pump
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

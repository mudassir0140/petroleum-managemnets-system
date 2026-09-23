// @ts-nocheck
"use client";

import { useMemo, useState, useEffect } from "react";
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

type PumpFormState = {
  pumpName: string;
  companyName: string;
  ownerName: string;
  password: string;
  city: string;
  address: string;
  phone: string;
};

type AddPumpState = {
  location: string;
  city: string;
};

function emptyForm(): PumpFormState {
  return { pumpName: "", companyName: "", ownerName: "", password: "", city: CITIES[0], address: "", phone: "" };
}

function emptyAddPumpForm(): AddPumpState {
  return { location: "", city: CITIES[0] };
}

function generateEmail(ownerName: string, pumpName: string): string {
  if (!ownerName || !pumpName) return "";
  const cleanOwner = ownerName.toLowerCase().trim().replace(/\s+/g, "");
  const cleanPump = pumpName.toLowerCase().trim().replace(/\s+/g, "");
  return `${cleanOwner}@${cleanPump}gmail.com`;
}

// Map a MongoDB pump record onto the shape this page renders.
function fromRecord(r: any, index: number, passwords: Record<string, string>): Pump {
  return {
    id: r._id,
    number: index + 1,
    name: r.name,
    owner: r.ownerName,
    ownerEmail: r.ownerEmail,
    password: passwords[r._id] ?? "",
    role: "pump-owner",
    accountStatus: "Active",
    city: r.city,
    address: r.address,
    lat: r.latitude ?? 0,
    lng: r.longitude ?? 0,
    phone: r.phone,
    status: r.status,
    since: String(r.createdAt).slice(0, 10),
    lastInspection: String(r.createdAt).slice(0, 10),
    todaySales: [
      { fuelType: "petrol", liters: 0, revenue: 0 },
      { fuelType: "diesel", liters: 0, revenue: 0 },
    ],
    weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
    monthlySales: 0,
    lastMonthSales: 0,
    petrolStock: r.petrolStock,
    petrolCapacity: r.petrolCapacity,
    dieselStock: r.dieselStock,
    dieselCapacity: r.dieselCapacity,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  } as Pump;
}

export default function PumpsPage() {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Pump | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const [showAddMorePump, setShowAddMorePump] = useState(false);
  const [selectedForAddMore, setSelectedForAddMore] = useState<Pump | null>(null);
  const [addMoreForm, setAddMoreForm] = useState(emptyAddPumpForm());

  const [error, setError] = useState("");
  // Passwords the admin set in this session (only the hash is stored in MongoDB)
  const [knownPasswords, setKnownPasswords] = useState<Record<string, string>>({});

  // Pumps live in MongoDB (single source of truth)
  async function loadPumps(passwords: Record<string, string> = knownPasswords) {
    try {
      const res = await fetch("/api/admin/pumps", { credentials: "include" });
      const data = await res.json();
      console.log("[Pumps] load response:", res.status, data);
      if (!res.ok) throw new Error(data.error || "Failed to load pumps");
      setPumps(data.pumps.map((r: any, i: number) => fromRecord(r, i, passwords)));
      setError("");
    } catch (err) {
      console.error("[Pumps] load failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load pumps");
    }
  }

  useEffect(() => {
    loadPumps();
  }, []);

  async function handleDeletePump(pump: Pump) {
    if (!window.confirm(`Delete ${pump.name}? Its owner login will stop working.`)) return;
    const res = await fetch(`/api/admin/pumps?pumpId=${encodeURIComponent(pump.id)}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete pump");
      return;
    }
    setSelected(null);
    await loadPumps();
  }

  // Reset password for pump owner
  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const newPassword = resetPasswordValue.trim();
    if (!newPassword || !selected) return;

    const res = await fetch("/api/admin/pumps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pumpId: selected.id, password: newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to reset password");
      return;
    }

    const passwords = { ...knownPasswords, [selected.id]: newPassword };
    setKnownPasswords(passwords);
    setSelected({ ...selected, password: newPassword });
    setResetPasswordValue("");
    setShowResetForm(false);
    await loadPumps(passwords);
  };

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

  async function handleAddPump(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.pumpName.trim() || !form.companyName.trim() || !form.ownerName.trim() || !form.password.trim()) {
      console.warn("[CreatePump] validation failed: missing required field");
      setError("Pump Name, Company Name, Owner Name, and Password are required");
      return;
    }

    const generatedEmail = generateEmail(form.ownerName, form.pumpName);
    const password = form.password.trim();
    const payload = {
      name: form.pumpName.trim(),
      companyName: form.companyName.trim(),
      ownerName: form.ownerName.trim(),
      ownerEmail: generatedEmail,
      password,
      phone: form.phone.trim() || "N/A",
      address: form.address.trim() || form.city,
      city: form.city,
      status: "Online",
    };
    console.log("[CreatePump] submitting", { ...payload, password: "***" });

    try {
      const res = await fetch("/api/admin/pumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[CreatePump] response:", res.status, data);
      if (!res.ok) {
        setError(data.error || "Failed to create pump");
        return;
      }

      const passwords = { ...knownPasswords, [data.pump._id]: password };
      setKnownPasswords(passwords);
      setForm(emptyForm());
      setShowAdd(false);
      await loadPumps(passwords);
    } catch (err) {
      console.error("[CreatePump] request failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create pump");
    }
  }

  async function handleAddMorePump(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedForAddMore || !addMoreForm.location.trim()) {
      setError("Location is required");
      return;
    }

    const locationName = addMoreForm.location.trim();
    const pump = selectedForAddMore;
    const payload = {
      name: `${pump.name} - ${locationName}`,
      companyName: pump.name,
      ownerName: pump.owner,
      ownerEmail: pump.ownerEmail,
      phone: pump.phone,
      address: locationName,
      city: addMoreForm.city,
      status: "Online",
    };

    console.log("[AddMorePump] submitting", payload);

    try {
      const res = await fetch("/api/admin/pumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[AddMorePump] response:", res.status, data);
      if (!res.ok) {
        setError(data.error || "Failed to add pump");
        return;
      }

      setAddMoreForm(emptyAddPumpForm());
      setSelectedForAddMore(null);
      setShowAddMorePump(false);
      await loadPumps();
    } catch (err) {
      console.error("[AddMorePump] request failed:", err);
      setError(err instanceof Error ? err.message : "Failed to add pump");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pumps"
        description="Every pump in the network — status, ownership, sales and performance."
        actions={
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <PlusIcon className="size-3.5" />
            Add New Pump
          </button>
        }
      />

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}

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
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((pump) => (
                <tr
                  key={pump.id}
                  onClick={() => {
                    setSelected(pump);
                    setShowPassword(false);
                  }}
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
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedForAddMore(pump);
                        setShowAddMorePump(true);
                        setError("");
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
                    >
                      + Add More Pump
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
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
          onClose={() => {
            setSelected(null);
            setShowPassword(false);
            setShowResetForm(false);
            setResetPasswordValue("");
          }}
        >
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Login Credentials for Pump Owner</p>
            <div className="mt-2 space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <div className="text-blue-800 dark:text-blue-300">
                  Email: <span className="font-semibold">{selected.ownerEmail}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.ownerEmail);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-blue-800 dark:text-blue-300">
                  Password: <span className="font-semibold">{showPassword ? selected.password || "(not viewable — use Reset Password)" : "••••••••"}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selected.password);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowResetForm(!showResetForm)}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              {showResetForm ? "Cancel Reset" : "Reset Password"}
            </button>

            {showResetForm && (
              <form onSubmit={handleResetPassword} className="mt-3 space-y-2 border-t border-blue-200 pt-3 dark:border-blue-900">
                <div>
                  <input
                    type="text"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded bg-white px-2 py-1 text-xs border border-blue-300 dark:border-blue-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDeletePump(selected)}
            className="mb-4 w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Delete Pump and Login
          </button>
          <DetailRow label="Owner" value={selected.owner} />
          <DetailRow label="Owner Email" value={selected.ownerEmail} />
          <DetailRow label="Account Status" value={<Badge color={selected.accountStatus === "Active" ? "green" : "red"}>{selected.accountStatus}</Badge>} />
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="City" value={selected.city} />
          <DetailRow label="Operational Status" value={<Badge>{selected.status}</Badge>} />
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
            {/* The page-level error banner above sits behind this modal's
                fixed overlay, so validation/API errors need their own
                visible copy here or submitting silently appears to do
                nothing. */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump Name *</label>
              <input
                required
                value={form.pumpName}
                onChange={(e) => setForm((f) => ({ ...f, pumpName: e.target.value }))}
                placeholder="e.g. Khan Petroleum Agency"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Company Name *</label>
              <input
                required
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="e.g. Khan Petroleum"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Pump Owner Name *</label>
              <input
                required
                value={form.ownerName}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                placeholder="e.g. Mudassir"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            {(form.ownerName || form.pumpName) && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Auto-Generated Email:</p>
                <p className="mt-1 font-mono text-sm text-blue-800 dark:text-blue-300">
                  {generateEmail(form.ownerName, form.pumpName) || "—"}
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Password *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
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

      {showAddMorePump && selectedForAddMore && (
        <Modal
          title="Add More Pump"
          subtitle={`For owner: ${selectedForAddMore.owner}`}
          onClose={() => {
            setShowAddMorePump(false);
            setSelectedForAddMore(null);
            setAddMoreForm(emptyAddPumpForm());
            setError("");
          }}
        >
          <form className="space-y-4" onSubmit={handleAddMorePump}>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200">Pump Details</p>
              <div className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <p><span className="font-semibold">Owner:</span> {selectedForAddMore.owner}</p>
                <p><span className="font-semibold">Email:</span> {selectedForAddMore.ownerEmail}</p>
                <p><span className="font-semibold">Base Name:</span> {selectedForAddMore.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Location/Address *</label>
              <input
                required
                value={addMoreForm.location}
                onChange={(e) => setAddMoreForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. North Branch, Main Office"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">City</label>
              <select
                value={addMoreForm.city}
                onChange={(e) => setAddMoreForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">New Pump Name:</p>
              <p className="mt-1 font-mono text-sm text-amber-800 dark:text-amber-300">
                {selectedForAddMore.name} - {addMoreForm.location || "location"}
              </p>
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

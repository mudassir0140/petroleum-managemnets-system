"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconArrowLeft, IconDroplet, IconWallet, IconTruck, IconUsers, IconCalendar, IconEye, IconEyeOff, IconCopy, IconLock, IconPlus } from "@/components/icons";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { useLivePoll } from "@/lib/khata/use-live-poll";
import { formatPkr } from "@/lib/khata/entry";

interface KhataEntry {
  _id: string;
  khataClientId: string;
  fuelType: string;
  litres: number;
  vehicleNumber: string;
  driverName: string;
  amount: number;
  date: string;
  attendantId: string;
  attendantName: string;
  givenRate?: number;
}

interface KhataPayment {
  _id: string;
  khataClientId: string;
  amountReceived: number;
  advancePaid: number;
  date: string;
  note: string;
}

interface KhataMonth {
  _id: string;
  month: string;
  openingBalance: number;
  totalFuel: number;
  paid: number;
  advance: number;
  remaining: number;
  status: "open" | "closed";
  createdAt: string;
}

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  phone: string;
  username?: string;
  password?: string;
  passwordChangedByUser?: boolean;
  petrolGivenRate: number;
  dieselGivenRate: number;
  totalFuelAmount: number;
  remainingBalance: number;
  totalPaid?: number;
  advancePaid?: number;
}

type FilterType = "all" | "today" | "week" | "month";

export default function KhataDetailPage() {
  const params = useParams();
  const khataClientId = params.id as string;

  const [client, setClient] = useState<KhataClient | null>(null);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [payments, setPayments] = useState<KhataPayment[]>([]);
  const [months, setMonths] = useState<KhataMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showOldMonths, setShowOldMonths] = useState(false);
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<KhataMonth | null>(null);
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ totalFuel: 0, paid: 0, advance: 0 });

  // Live sync from MongoDB: refetch every 3 seconds, never overlapping requests.
  useLivePoll(
    async () => {
      await Promise.all([fetchClient(), fetchEntries(), fetchPayments(), fetchMonths()]);
    },
    3000,
    [khataClientId],
    Boolean(khataClientId)
  );

  async function fetchClient() {
    try {
      const response = await fetch(`/api/khata/clients/${khataClientId}`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (err) {
      console.error("Error fetching client:", err);
    }
  }

  async function fetchEntries() {
    try {
      const response = await fetch(`/api/khata/entries?khataClientId=${khataClientId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  }

  async function fetchPayments() {
    try {
      const response = await fetch(`/api/khata/payments?khataClientId=${khataClientId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  }

  async function fetchMonths() {
    try {
      const response = await fetch(`/api/khata/months?khataClientId=${khataClientId}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setMonths(Array.isArray(data) ? data : []);
        // Auto-select the current/open month
        const openMonth = data.find((m: KhataMonth) => m.status === "open");
        if (openMonth && !selectedMonth) {
          setSelectedMonth(openMonth);
        }
      }
    } catch (err) {
      console.error("Error fetching months:", err);
    }
  }

  async function handleCreateMonth() {
    setCreatingMonth(true);
    try {
      const response = await fetch("/api/khata/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ khataClientId }),
      });
      if (response.ok) {
        const data = await response.json();
        setMonths((prev) => [data, ...prev]);
        setSelectedMonth(data);
        setShowOldMonths(false);
        alert("New month created and previous month closed!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error creating month:", err);
      alert("Error creating month");
    } finally {
      setCreatingMonth(false);
    }
  }

  async function handleSaveMonthEdit() {
    if (!editingMonthId) return;

    try {
      const response = await fetch(`/api/khata/months/${editingMonthId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (response.ok) {
        const data = await response.json();
        setMonths((prev) =>
          prev.map((m) => (m._id === editingMonthId ? data : m))
        );
        setSelectedMonth(data);
        setEditingMonthId(null);
        alert("Month updated successfully!");
      } else {
        alert("Error updating month");
      }
    } catch (err) {
      console.error("Error updating month:", err);
      alert("Error updating month");
    }
  }

  async function handleCreateLogin() {
    setCreatingLogin(true);
    try {
      const response = await fetch(`/api/khata/clients/${khataClientId}/login`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setClient((prev) => prev ? { ...prev, username: data.username, password: data.password } : null);
        alert(`Login created!\nUsername: ${data.username}\nPassword: ${data.password}`);
      } else {
        alert("Failed to create login");
      }
    } catch (err) {
      console.error("Error creating login:", err);
      alert("Error creating login");
    } finally {
      setCreatingLogin(false);
    }
  }

  async function handleResetPassword() {
    if (!confirm("Are you sure you want to reset the password? This will generate a new one.")) {
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch(`/api/khata/clients/${khataClientId}/reset-password`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setClient((prev) => prev ? { ...prev, password: data.password } : null);
        setShowPassword(true);
        alert(`Password reset!\nNew password: ${data.password}`);
      } else {
        alert("Failed to reset password");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Error resetting password");
    } finally {
      setResettingPassword(false);
    }
  }

  const getFilteredEntries = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

      switch (filter) {
        case "today":
          return entryDateOnly.getTime() === today.getTime();
        case "week":
          return entryDate >= weekAgo;
        case "month":
          return entryDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredEntries = getFilteredEntries();

  const calculateTotals = (entriesToSum: KhataEntry[]) => {
    return {
      totalAmount: entriesToSum.reduce((sum, e) => sum + (e.amount || 0), 0),
      totalPetrolLitres: entriesToSum
        .filter((e) => e.fuelType === "Petrol")
        .reduce((sum, e) => sum + (e.litres || 0), 0),
      totalDieselLitres: entriesToSum
        .filter((e) => e.fuelType === "Diesel")
        .reduce((sum, e) => sum + (e.litres || 0), 0),
      totalPaid: payments.reduce((sum, p) => sum + (p.amountReceived || 0), 0),
      totalAdvance: payments.reduce((sum, p) => sum + (p.advancePaid || 0), 0),
    };
  };

  const totals = calculateTotals(filteredEntries);
  const remainingBalance = Math.max(0, totals.totalAmount - totals.totalPaid);

  const getDayWiseSummary = () => {
    const summary: Record<string, { entries: KhataEntry[]; total: number }> = {};
    filteredEntries.forEach((entry) => {
      const date = formatDate(entry.date);
      if (!summary[date]) {
        summary[date] = { entries: [], total: 0 };
      }
      summary[date].entries.push(entry);
      summary[date].total += entry.amount || 0;
    });
    return Object.entries(summary).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  };

  const dayWiseSummary = getDayWiseSummary();

  const currentMonth = selectedMonth || months.find((m) => m.status === "open");
  const monthEndTotal = (currentMonth?.openingBalance || 0) + (currentMonth?.totalFuel || 0);
  const monthRemaining = Math.max(0, monthEndTotal - (currentMonth?.paid || 0) - (currentMonth?.advance || 0));

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  if (!client) {
    return (
      <div>
        <Link href="/pumpadmin/khata" className="flex items-center gap-2 mb-4 text-brand-500 hover:text-brand-600">
          <IconArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
          <span className="hidden sm:inline text-ink-muted">/</span>
          <span className="hidden sm:inline">واپس</span>
        </Link>
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata details...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/pumpadmin/khata" className="flex items-center gap-2 mb-4 text-brand-500 hover:text-brand-600 transition-colors">
        <IconArrowLeft size={16} />
        <span className="hidden sm:inline">Back</span>
        <span className="hidden sm:inline text-ink-muted">/</span>
        <span className="hidden sm:inline">واپس</span>
      </Link>

      <PageHeader
        title={`${client.clientName} / ${client.department}`}
        description={`Khata account details and transaction history`}
      />

      {/* Month Management Buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={handleCreateMonth}
          disabled={creatingMonth}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          <IconPlus size={16} />
          {creatingMonth ? "Creating..." : "New Month Khata / نیا مہینہ کھاتہ"}
        </button>
        <button
          onClick={() => setShowOldMonths(!showOldMonths)}
          className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition text-sm font-medium"
        >
          Old Months / پرانے مہینے ({months.length})
        </button>
      </div>

      {/* Old Months List */}
      {showOldMonths && months.length > 1 && (
        <Card className="mb-6 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            All Months / تمام مہینے
          </h3>
          <div className="space-y-2">
            {months.map((month) => (
              <button
                key={month._id}
                onClick={() => {
                  setSelectedMonth(month);
                  setShowOldMonths(false);
                }}
                className={`w-full p-3 rounded-lg border transition text-left ${
                  selectedMonth?._id === month._id
                    ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {getMonthName(month.month)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Status: {month.status === "open" ? "Open / کھلا" : "Closed / بند"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(month.remaining)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Remaining
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Current Month Details */}
      {currentMonth && (
        <Card className="mb-6 p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {getMonthName(currentMonth.month)} / {currentMonth.month}
            </h3>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-xs font-medium">
              {currentMonth.status === "open" ? "Open / کھلا" : "Closed / بند"}
            </span>
          </div>

          {currentMonth.openingBalance > 0 && (
            <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Previous Month Balance / پچھلے مہینے کا بقایا
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatCurrency(currentMonth.openingBalance)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Fuel</p>
              {editingMonthId === currentMonth._id ? (
                <input
                  type="number"
                  value={editValues.totalFuel}
                  onChange={(e) =>
                    setEditValues({ ...editValues, totalFuel: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 rounded border border-slate-300 px-2 py-1 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(currentMonth.totalFuel)}
                </p>
              )}
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Paid / ادا کیا</p>
              {editingMonthId === currentMonth._id ? (
                <input
                  type="number"
                  value={editValues.paid}
                  onChange={(e) =>
                    setEditValues({ ...editValues, paid: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 rounded border border-slate-300 px-2 py-1 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              ) : (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(currentMonth.paid)}
                </p>
              )}
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Advance / پیش رقم</p>
              {editingMonthId === currentMonth._id ? (
                <input
                  type="number"
                  value={editValues.advance}
                  onChange={(e) =>
                    setEditValues({ ...editValues, advance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 rounded border border-slate-300 px-2 py-1 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              ) : (
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(currentMonth.advance)}
                </p>
              )}
            </div>
          </div>

          {/* Month End Total Summary */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Month End Total / مہینے کا کل
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(monthEndTotal)}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                = Opening Balance ({formatCurrency(currentMonth.openingBalance || 0)}) + Total Fuel ({formatCurrency(currentMonth.totalFuel || 0)})
              </p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Remaining / بقایا (Read-only / صرف پڑھنے کے لیے)
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(monthRemaining)}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              = Month End Total ({formatCurrency(monthEndTotal)}) − Paid ({formatCurrency(currentMonth.paid || 0)}) − Advance ({formatCurrency(currentMonth.advance || 0)})
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            {editingMonthId === currentMonth._id ? (
              <>
                <button
                  onClick={handleSaveMonthEdit}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                >
                  Save / محفوظ کریں
                </button>
                <button
                  onClick={() => setEditingMonthId(null)}
                  className="flex-1 px-3 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition text-sm font-medium"
                >
                  Cancel / منسوخ کریں
                </button>
              </>
            ) : (
              currentMonth.status === "open" && (
                <button
                  onClick={() => {
                    setEditingMonthId(currentMonth._id);
                    setEditValues({
                      totalFuel: currentMonth.totalFuel,
                      paid: currentMonth.paid,
                      advance: currentMonth.advance,
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                >
                  Edit / ترمیم
                </button>
              )
            )}
          </div>
        </Card>
      )}

      {client.username && (client.password || client.passwordChangedByUser) ? (
        <Card className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconLock size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Client Login / کلائنٹ لاگ ان
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Username / صارف نام</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={client.username}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(client.username || "");
                    alert("Username copied!");
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  <IconCopy size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password / پاس ورڈ</p>
              {!client.password ? (
                <p className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm italic text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Password changed by user / صارف نے پاس ورڈ تبدیل کر دیا
                </p>
              ) : (
              <div className="flex gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  readOnly
                  value={client.password}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition dark:bg-slate-600 dark:text-slate-300"
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(client.password || "");
                    alert("Password copied!");
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  <IconCopy size={16} />
                </button>
              </div>
              )}
            </div>

            <button
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm disabled:opacity-50"
            >
              {resettingPassword ? "Resetting..." : "Reset Password / دوبارہ پاس ورڈ"}
            </button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconLock size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Create Client Login / کلائنٹ لاگ ان بنائیں
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            This khata doesn't have a login yet. Create one to allow the client to log in.
          </p>
          <button
            onClick={handleCreateLogin}
            disabled={creatingLogin}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm disabled:opacity-50"
          >
            {creatingLogin ? "Creating..." : "Create Login / بنائیں"}
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Fuel Amount / کل ایندھن</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totals.totalAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Amount Paid / رقم ادا کی گئی</p>
          <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.totalPaid)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Remaining Balance / بقایا</p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(remainingBalance)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Advance / پیش رقم</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totals.totalAdvance)}
          </p>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Petrol / پیٹرول</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {(totals.totalPetrolLitres || 0).toFixed(2)} L
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Diesel / ڈیزل</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {(totals.totalDieselLitres || 0).toFixed(2)} L
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Petrol Rate / شرح</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              PKR {(client.petrolGivenRate || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Diesel Rate / شرح</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              PKR {(client.dieselGivenRate || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {(["all", "today", "week", "month"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === f
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {f === "all" ? "All / سب" : f === "today" ? "Today / آج" : f === "week" ? "This Week / اس ہفتے" : "This Month / اس مہینے"}
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title="No transactions / کوئی ریکارڈ نہیں"
          description="No khata entries for this period"
        />
      ) : (
        <div className="space-y-4">
          {dayWiseSummary.map(([date, dayData]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <IconCalendar size={16} />
                  {date}
                </h3>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(dayData.total)}
                </p>
              </div>
              <div className="space-y-2">
                {dayData.entries.map((entry) => (
                  <Card key={entry._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconDroplet size={16} className={entry.fuelType === "Petrol" ? "text-blue-600" : "text-green-600"} />
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {entry.fuelType}
                          </span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {(entry.litres || 0).toFixed(2)} L
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {entry.vehicleNumber && (
                            <div className="flex items-center gap-2">
                              <IconTruck size={14} />
                              <span>{entry.vehicleNumber}</span>
                            </div>
                          )}
                          {entry.driverName && (
                            <div className="flex items-center gap-2">
                              <IconUsers size={14} />
                              <span>{entry.driverName}</span>
                            </div>
                          )}
                          {entry.attendantName && (
                            <p>Attendant / ملازم: {entry.attendantName}</p>
                          )}
                          {entry.givenRate && (
                            <p>Rate / شرح: PKR {(entry.givenRate || 0).toFixed(2)}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {formatDateTime(entry.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Rs {formatPkr(entry.amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

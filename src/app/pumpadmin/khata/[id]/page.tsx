"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconArrowLeft, IconDroplet, IconWallet, IconTruck, IconUsers, IconCalendar, IconEye, IconEyeOff, IconCopy, IconLock } from "@/components/icons";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

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

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  phone: string;
  username?: string;
  password?: string;
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
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (khataClientId) {
      fetchClient();
      fetchEntries();
      fetchPayments();
    }
  }, [khataClientId]);

  async function fetchClient() {
    try {
      const response = await fetch(`/api/khata/clients/${khataClientId}`);
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
      const response = await fetch(`/api/khata/entries?khataClientId=${khataClientId}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  }

  async function fetchPayments() {
    try {
      const response = await fetch(`/api/khata/payments?khataClientId=${khataClientId}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
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

      {client.username && client.password ? (
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
            </div>
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
            onClick={() => {
              // TODO: Implement create login functionality
              alert("Create login functionality coming soon");
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm"
          >
            Create Login
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
                          {formatCurrency(entry.amount || 0)}
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

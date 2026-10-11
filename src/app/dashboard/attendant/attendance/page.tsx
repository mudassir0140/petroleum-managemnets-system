"use client";

import { useState, useEffect } from "react";
import { KhataPanel } from "@/components/attendant/KhataPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { DropletIcon } from "@/components/icons";

interface ShiftRecord {
  _id?: string;
  date: string;
  fuelType: string;
  startReading: number;
  endReading?: number;
  reading?: number;
  photo?: string;
  photoUrl?: string;
  litresSold?: number;
  amount?: number;
  createdAt?: string;
}

interface AttendanceDay {
  date: string;
  status: "Present" | "Absent" | "Off";
  startReading?: number;
  endReading?: number;
  fuelType?: string;
  photo?: string;
}

export default function AttendancePagePage() {
  const [activeTab, setActiveTab] = useState<"tiles" | "start" | "end">("tiles");
  const [formData, setFormData] = useState({
    fuelType: "Petrol",
    meterReading: "",
    nozzle: "",
    photo: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<ShiftRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showKhataPanel, setShowKhataPanel] = useState(false);
  const [rates, setRates] = useState({ petrol: 200, diesel: 180 });
  const [pumpId, setPumpId] = useState<string>("");

  // Fetch rates on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/attendant/rates");
        if (response.ok) {
          const data = await response.json();
          setRates({ petrol: data.petrol, diesel: data.diesel });
        }
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      }
    })();
  }, []);

  // Get pump ID from session (assuming it's available)
  useEffect(() => {
    // In a real app, get from session
    setPumpId("your-pump-id");
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth]);

  async function fetchHistory() {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendant/shifts?month=${selectedMonth}`);
      if (!response.ok) throw new Error("Failed to fetch shift history");
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartShift(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.meterReading) {
      setError("Meter reading is required");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("fuelType", formData.fuelType);
    formDataToSend.append("reading", formData.meterReading);
    formDataToSend.append("nozzle", formData.nozzle);
    if (formData.photo) {
      formDataToSend.append("photo", formData.photo);
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/attendant/shifts/start", {
        method: "POST",
        body: formDataToSend,
      });
      if (!response.ok) throw new Error("Failed to start shift");

      setSuccess("Shift started successfully!");
      setFormData({ fuelType: "Petrol", meterReading: "", nozzle: "", photo: null });
      setActiveTab("end");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleEndShift(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.meterReading) {
      setError("Meter reading is required");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("reading", formData.meterReading);
    if (formData.photo) {
      formDataToSend.append("photo", formData.photo);
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/attendant/shifts/end", {
        method: "POST",
        body: formDataToSend,
      });
      if (!response.ok) throw new Error("Failed to end shift");

      setSuccess("Shift ended successfully!");
      setFormData({ fuelType: "Petrol", meterReading: "", nozzle: "", photo: null });
      setActiveTab("tiles");
      fetchHistory();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          title="Attendance / حاضری"
          description="Manage your shift and view attendance records"
        />
        <button
          onClick={() => setShowKhataPanel(true)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          Khata Accounts / کھاتہ اکاؤنٹس
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
          {success}
        </div>
      )}

      {activeTab === "tiles" && (
        <>
          {/* Rates Tiles */}
          <div className="mb-6 grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => setActiveTab("start")}
              className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-4 text-center transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/10"
            >
              <DropletIcon className="mb-2 size-5 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Petrol</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">پیٹرول</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                Rs. {rates.petrol || "—"}
              </p>
            </button>

            <button
              onClick={() => setActiveTab("start")}
              className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-4 text-center transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10"
            >
              <DropletIcon className="mb-2 size-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Diesel</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">ڈیزل</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                Rs. {rates.diesel || "—"}
              </p>
            </button>

            <button
              onClick={() => setActiveTab("start")}
              className="aspect-square flex flex-col items-center justify-center rounded-lg border border-amber-300 bg-amber-50 p-4 text-center transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-500/10 dark:hover:border-amber-500/70 dark:hover:bg-amber-500/20"
            >
              <span className="mb-2 text-xl">▶</span>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Start Shift</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">شفٹ شروع</p>
            </button>

            <button
              onClick={() => setActiveTab("end")}
              className="aspect-square flex flex-col items-center justify-center rounded-lg border border-orange-300 bg-orange-50 p-4 text-center transition hover:border-orange-400 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-500/10 dark:hover:border-orange-500/70 dark:hover:bg-orange-500/20"
            >
              <span className="mb-2 text-xl">⏹</span>
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">End Shift</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">شفٹ ختم</p>
            </button>

            <div className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  fetchHistory();
                }}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">Select Month</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">مہینہ منتخب</p>
            </div>
          </div>

          {/* History Tiles */}
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Shift History / شفٹ ہسٹری</h3>
          {loading ? (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              No shift records found for this month
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
              {history.map((record, idx) => (
                <div
                  key={idx}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                >
                  <DropletIcon
                    className={`mb-2 size-4 ${
                      record.fuelType === "Petrol"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  />
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {record.fuelType}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Start: {record.startReading || "—"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    End: {record.endReading || "—"}
                  </p>
                  {record.litresSold && (
                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {record.litresSold.toFixed(1)}L
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "start" && (
        <Card>
          <CardHeader title="Start Your Shift / شفٹ شروع کریں" />
          <form onSubmit={handleStartShift} className="space-y-4 p-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Fuel Type / ایندھن کی قسم
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Nozzle / نوزل
              </label>
              <input
                type="text"
                value={formData.nozzle}
                onChange={(e) => setFormData({ ...formData, nozzle: e.target.value })}
                placeholder="e.g. 1, 2, 3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Meter Reading / میٹر کی قرات
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.meterReading}
                onChange={(e) => setFormData({ ...formData, meterReading: e.target.value })}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Meter Photo / میٹر کی تصویر
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                className="mt-1 w-full text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {loading ? "Submitting..." : "Start Shift"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tiles")}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Back
              </button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === "end" && (
        <Card>
          <CardHeader title="End Your Shift / شفٹ ختم کریں" />
          <form onSubmit={handleEndShift} className="space-y-4 p-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                End Meter Reading / اختتام میٹر کی قرات
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.meterReading}
                onChange={(e) => setFormData({ ...formData, meterReading: e.target.value })}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Meter Photo / میٹر کی تصویر
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                className="mt-1 w-full text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {loading ? "Submitting..." : "End Shift"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tiles")}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Back
              </button>
            </div>
          </form>
        </Card>
      )}

      <KhataPanel
        isOpen={showKhataPanel}
        onClose={() => setShowKhataPanel(false)}
        pumpId={pumpId}
        petrolRate={rates.petrol}
        dieselRate={rates.diesel}
      />
    </div>
  );
}

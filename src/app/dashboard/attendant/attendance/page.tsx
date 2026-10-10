"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { RatesHeader } from "@/components/attendant/RatesHeader";
import { KhataPanel } from "@/components/attendant/KhataPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

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
  const [activeTab, setActiveTab] = useState<"start" | "end" | "history">("start");
  const [formData, setFormData] = useState({
    fuelType: "Petrol",
    meterReading: "",
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
      setFormData({ fuelType: "Petrol", meterReading: "", photo: null });
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
      setFormData({ fuelType: "Petrol", meterReading: "", photo: null });
      setActiveTab("history");
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
      <BackButton href="/dashboard/attendant" />
      <RatesHeader />
      <div className="mb-4 flex items-center justify-between">
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

      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("start")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "start"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Start Shift / شفٹ شروع کریں
        </button>
        <button
          onClick={() => setActiveTab("end")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "end"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          End Shift / شفٹ ختم کریں
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "history"
              ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          History / تاریخ
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

      {activeTab === "start" && (
        <Card>
          <CardHeader title="Start Your Shift" />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {loading ? "Submitting..." : "Start Shift"}
            </button>
          </form>
        </Card>
      )}

      {activeTab === "end" && (
        <Card>
          <CardHeader title="End Your Shift" />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              {loading ? "Submitting..." : "End Shift"}
            </button>
          </form>
        </Card>
      )}

      {activeTab === "history" && (
        <>
          <div className="mb-4 flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {loading ? (
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">Loading...</div>
          ) : history.length === 0 ? (
            <Card>
              <div className="p-6 text-center text-sm text-slate-600 dark:text-slate-400">
                No shift records found for this month
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((record, idx) => (
                <Card key={idx} className="p-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {record.fuelType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Start: {record.startReading} | End: {record.endReading || "—"}
                    </p>
                    {record.litresSold && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Litres: {record.litresSold.toFixed(2)} | Amount: {record.amount?.toFixed(2) || "—"}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
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

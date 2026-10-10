"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconArrowLeft, IconPlus } from "@/components/icons";

interface KhataData {
  _id: string;
  clientName: string;
  department: string;
  numberOfVehicles: number;
  vehicleTypes: string[];
  totalFuelAmount: number;
  totalPaid: number;
  advancePaid: number;
  remainingBalance: number;
  entries: Array<{
    _id: string;
    fuelType: string;
    litres: number;
    vehicleNumber: string;
    driverName: string;
    amount: number;
    date: string;
  }>;
  payments: Array<{
    _id: string;
    amountReceived: number;
    advancePaid: number;
    date: string;
    note: string;
  }>;
}

export default function KhataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [khata, setKhata] = useState<KhataData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amountReceived: "",
    advancePaid: "",
    note: "",
  });

  useEffect(() => {
    fetchKhata();
  }, [id]);

  async function fetchKhata() {
    try {
      setLoading(true);
      // For pump owner to see khata client details, we'll create a dedicated endpoint
      const response = await fetch(`/api/khata/clients/${id}`);
      if (!response.ok) throw new Error("Failed to fetch khata client");
      const data = await response.json();
      setKhata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();

    if (!paymentData.amountReceived && !paymentData.advancePaid) {
      setError("Please enter at least one payment amount");
      return;
    }

    try {
      setError("");
      const response = await fetch("/api/khata/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          khataClientId: id,
          amountReceived: paymentData.amountReceived || 0,
          advancePaid: paymentData.advancePaid || 0,
          note: paymentData.note,
        }),
      });

      if (!response.ok) throw new Error("Failed to add payment");

      setPaymentData({ amountReceived: "", advancePaid: "", note: "" });
      setShowPaymentForm(false);
      fetchKhata();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  if (loading) {
    return <div className="text-center text-sm text-slate-600 dark:text-slate-400">Loading khata details...</div>;
  }

  if (!khata) {
    return (
      <div>
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          Khata client not found
        </div>
        <Link href="/pump-owner/dashboard/khata" className="text-sm text-amber-600 hover:underline">
          Back to Khata
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/pump-owner/dashboard/khata"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <IconArrowLeft size={18} />
        Back to Khata
      </Link>

      <PageHeader
        title={khata.clientName}
        description={`Department: ${khata.department} | Vehicles: ${khata.numberOfVehicles}`}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Fuel Amount</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            PKR {khata.totalFuelAmount.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Paid</p>
          <p className="mt-2 text-lg font-semibold text-green-600 dark:text-green-400">
            PKR {khata.totalPaid.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Advance Paid</p>
          <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
            PKR {khata.advancePaid.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Remaining Balance</p>
          <p className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
            PKR {khata.remainingBalance.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Payments Section */}
      <div className="mb-6">
        {!showPaymentForm ? (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            <IconPlus size={18} />
            Record Payment
          </button>
        ) : null}

        {showPaymentForm && (
          <Card className="mb-6">
            <CardHeader title="Add Payment / ادائیگی درج کریں" />
            <form onSubmit={handleAddPayment} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Amount Received / وصول شدہ رقم
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amountReceived}
                  onChange={(e) => setPaymentData({ ...paymentData, amountReceived: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Advance Paid / پیشگی رقم
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.advancePaid}
                  onChange={(e) => setPaymentData({ ...paymentData, advancePaid: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Note / نوٹ
                </label>
                <input
                  type="text"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                  placeholder="Optional note"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setError("");
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Payments History */}
      {khata.payments.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Payment History / ادائیگی کی تاریخ" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {khata.payments.map((payment) => (
              <div key={payment._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                    {payment.note && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{payment.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {payment.amountReceived > 0 && (
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Received: PKR {payment.amountReceived.toFixed(2)}
                      </p>
                    )}
                    {payment.advancePaid > 0 && (
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Advance: PKR {payment.advancePaid.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fuel Entries */}
      {khata.entries.length > 0 && (
        <Card>
          <CardHeader title="Fuel Entries / ایندھن کی داخلہ" />
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {khata.entries.map((entry) => (
              <div key={entry._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {entry.vehicleNumber}
                      </span>
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {entry.fuelType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Driver: {entry.driverName || "N/A"} | {entry.litres} L | {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                    PKR {entry.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

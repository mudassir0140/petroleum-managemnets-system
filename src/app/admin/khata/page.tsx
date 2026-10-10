"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconPlus, IconChevronRight } from "@/components/icons";

interface KhataClient {
  _id: string;
  clientName: string;
  department: string;
  phone: string;
  petrolGivenRate: number;
  dieselGivenRate: number;
  totalFuelAmount: number;
  remainingBalance: number;
  createdAt: string;
}

export default function AdminKhataPage() {
  const [clients, setClients] = useState<KhataClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const response = await fetch("/api/khata/clients");
      if (!response.ok) throw new Error("Failed to fetch khata clients");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Khata Clients / کھاتہ کلائنٹس"
        description="Manage all khata client accounts"
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/admin/khata/create"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <IconPlus size={18} />
          Create Khata / کھاتہ بنائیں
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Loading khata clients...
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No Khata Clients Yet / ابھی کوئی کھاتہ نہیں"
          description="Create your first khata client account"
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Link
              key={client._id}
              href={`/admin/khata/${client._id}`}
              className="block"
            >
              <Card className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {client.clientName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {client.department}
                      </span>
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {client.phone}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Petrol: PKR {client.petrolGivenRate.toFixed(2)} | Diesel: PKR {client.dieselGivenRate.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Total Fuel: PKR {client.totalFuelAmount.toFixed(2)} | Balance: PKR {client.remainingBalance.toFixed(2)}
                    </p>
                  </div>
                  <IconChevronRight size={18} className="text-slate-400 dark:text-slate-600 shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

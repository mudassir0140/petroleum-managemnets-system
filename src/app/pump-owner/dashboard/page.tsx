"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Pump } from "@/lib/dashboard/data/pumps";

export default function PumpOwnerDashboardPage() {
  const router = useRouter();
  const [pump, setPump] = useState<Pump | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load pump from localStorage using session data
    if (typeof window !== "undefined") {
      try {
        const sessionData = localStorage.getItem("pump_owner_session");
        if (!sessionData) {
          router.push("/auth/login");
          return;
        }

        const session = JSON.parse(sessionData);
        const pumpId = session.pumpId;

        const pumpsData = localStorage.getItem("petromanage:pumps");
        if (!pumpsData) {
          setError("Pump information not found. Please contact your administrator.");
          setIsLoading(false);
          return;
        }

        const pumps = JSON.parse(pumpsData) as Pump[];
        const foundPump = pumps.find(p => p.id === pumpId);

        if (!foundPump) {
          setError("Pump information not found. Please contact your administrator.");
          setIsLoading(false);
          return;
        }

        setPump(foundPump);
        setIsLoading(false);
      } catch (err) {
        setError("Error loading pump information");
        setIsLoading(false);
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Loading pump information...</p>
      </div>
    );
  }

  if (error || !pump) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {error || "Pump information not found. Please contact your administrator."}
        </p>
      </div>
    );
  }

  const petrolPercentage = (pump.petrolStock / pump.petrolCapacity) * 100;
  const dieselPercentage = (pump.dieselStock / pump.dieselCapacity) * 100;

  return (
    <div className="space-y-8">
      {/* Pump Overview */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pump Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Pump ID</p>
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white font-mono">{pump.id}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                pump.status === "Online" ? "bg-green-500" :
                pump.status === "Maintenance" ? "bg-yellow-500" :
                pump.status === "Offline" ? "bg-red-500" :
                "bg-gray-500"
              }`}></span>
              <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{pump.status}</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Location</p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{pump.city}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Contact</p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{pump.phone}</p>
          </div>
        </div>
      </div>

      {/* Fuel Inventory */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Fuel Inventory</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Petrol */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Petrol</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {pump.petrolStock.toLocaleString()} L
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capacity: {pump.petrolCapacity.toLocaleString()} L
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  petrolPercentage > 75 ? "bg-green-500" :
                  petrolPercentage > 25 ? "bg-yellow-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(petrolPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {petrolPercentage.toFixed(1)}% capacity
            </p>
          </div>

          {/* Diesel */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Diesel</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {pump.dieselStock.toLocaleString()} L
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capacity: {pump.dieselCapacity.toLocaleString()} L
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  dieselPercentage > 75 ? "bg-green-500" :
                  dieselPercentage > 25 ? "bg-yellow-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(dieselPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {dieselPercentage.toFixed(1)}% capacity
            </p>
          </div>
        </div>
      </div>

      {/* Pump Details */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pump Details</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Address</p>
              <p className="mt-2 text-sm text-slate-900 dark:text-white">{pump.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Owner Email</p>
              <p className="mt-2 text-sm text-slate-900 dark:text-white">{pump.ownerEmail}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Created</p>
              <p className="mt-2 text-sm text-slate-900 dark:text-white">
                {new Date(pump.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PumpData {
  _id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  status: "Online" | "Offline" | "Maintenance";
  petrolStock: number;
  petrolCapacity: number;
  dieselStock: number;
  dieselCapacity: number;
  createdAt: string;
  updatedAt: string;
}

export default function PumpOwnerDashboard() {
  const router = useRouter();
  const [pump, setPump] = useState<PumpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPump = async () => {
      try {
        const sessionData = localStorage.getItem("pump_owner_session");
        if (!sessionData) {
          router.push("/auth/login");
          return;
        }

        const session = JSON.parse(sessionData);
        const pumpId = session.pumpId;

        if (!pumpId) {
          setError("Pump information not found");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/admin/pumps-mongodb?pumpId=${pumpId}`);
        if (!response.ok) {
          throw new Error("Failed to load pump data");
        }

        const data = await response.json();
        if (data.pump) {
          setPump(data.pump);
        } else {
          setError("Pump not found");
        }
      } catch (err) {
        console.error("Error loading pump:", err);
        setError("Error loading pump information");
      } finally {
        setLoading(false);
      }
    };

    loadPump();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-600">Loading pump information...</p>
      </div>
    );
  }

  if (error || !pump) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">{error || "Pump not found"}</p>
      </div>
    );
  }

  const petrolPercentage = (pump.petrolStock / pump.petrolCapacity) * 100;
  const dieselPercentage = (pump.dieselStock / pump.dieselCapacity) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{pump.name}</h1>
        <p className="text-slate-600">Owner: {pump.ownerName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">Pump Status</p>
          <p className={`mt-2 text-lg font-bold ${
            pump.status === "Online" ? "text-green-600" :
            pump.status === "Maintenance" ? "text-yellow-600" :
            "text-red-600"
          }`}>
            {pump.status}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">Location</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{pump.city}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">Phone</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{pump.phone}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-600">Created</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {new Date(pump.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Fuel Inventory</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-600">Petrol</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {pump.petrolStock.toLocaleString()} L
            </p>
            <p className="text-xs text-slate-500">
              Capacity: {pump.petrolCapacity.toLocaleString()} L
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  petrolPercentage > 75 ? "bg-green-500" :
                  petrolPercentage > 25 ? "bg-yellow-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(petrolPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {petrolPercentage.toFixed(1)}% capacity
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-600">Diesel</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {pump.dieselStock.toLocaleString()} L
            </p>
            <p className="text-xs text-slate-500">
              Capacity: {pump.dieselCapacity.toLocaleString()} L
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  dieselPercentage > 75 ? "bg-green-500" :
                  dieselPercentage > 25 ? "bg-yellow-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(dieselPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {dieselPercentage.toFixed(1)}% capacity
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Pump Details</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-600">Address</p>
              <p className="mt-2 text-sm text-slate-900">{pump.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Email</p>
              <p className="mt-2 text-sm text-slate-900">{pump.ownerEmail}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Created</p>
              <p className="mt-2 text-sm text-slate-900">
                {new Date(pump.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Last Updated</p>
              <p className="mt-2 text-sm text-slate-900">
                {new Date(pump.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
